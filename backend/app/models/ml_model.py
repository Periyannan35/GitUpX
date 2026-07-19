import os
import json
import joblib
from pathlib import Path
from typing import Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
from app.core.config import settings
from app.core.logger import logger

class GitUpXClassifier:
    def __init__(self):
        self.vectorizer: TfidfVectorizer = None
        self.model: LogisticRegression = None
        self.is_trained: bool = False
        self._ensure_models_dir()

    def _ensure_models_dir(self):
        Path(settings.MODEL_PATH).parent.mkdir(parents=True, exist_ok=True)

    def _extract_text_feature(self, context_dict: Dict[str, Any]) -> str:
        var_name = str(context_dict.get("variable_name") or "")
        parent_fn = str(context_dict.get("parent_function_name") or "")
        parent_class = str(context_dict.get("parent_class_name") or "")
        file_path = str(context_dict.get("file_path") or "")
        lines_before = " ".join([str(x) for x in context_dict.get("lines_before", [])])
        lines_after = " ".join([str(x) for x in context_dict.get("lines_after", [])])
        
        return f"{var_name} {parent_fn} {parent_class} {file_path} {lines_before} {lines_after}".lower()

    def generate_synthetic_data(self) -> str:
        dataset_path = Path(settings.get_root_dir()) / "data" / "sample_dataset.json"
        dataset_path.parent.mkdir(parents=True, exist_ok=True)
        
        if dataset_path.exists():
            return str(dataset_path)

        logger.info("Generating synthetic dataset (200 samples) for ML classifier...")
        samples = []
        
        # 100 Mock/Test samples (Label 0)
        mock_vars = ["mock_api_key", "test_password", "fake_secret", "dummy_token", "sandbox_db_url",
                     "test_aws_key", "mock_stripe_key", "fixture_token", "sample_jwt", "stub_secret"]
        mock_paths = ["tests/test_auth.py", "spec/api_spec.js", "src/mocks/fixtures.ts", "test/unit_test.py", "mock_data.json"]
        mock_funcs = ["test_login_success", "mock_stripe_client", "setup_test_db", "assert_auth_header", "create_fake_user"]
        
        for i in range(100):
            var = mock_vars[i % len(mock_vars)]
            path = mock_paths[i % len(mock_paths)]
            func = mock_funcs[i % len(mock_funcs)]
            samples.append({
                "context": {
                    "variable_name": var,
                    "parent_function_name": func,
                    "parent_class_name": "TestAuthSuite" if i % 2 == 0 else "",
                    "file_path": path,
                    "lines_before": ["# Unit test setup", f"client = MockClient(api_key='{var}')"],
                    "lines_after": ["assert client.is_authenticated() == True", "client.close()"]
                },
                "label": 0  # mock_test_context
            })

        # 100 Production samples (Label 1)
        prod_vars = ["AWS_SECRET_ACCESS_KEY", "DATABASE_URL", "PROD_API_KEY", "LIVE_STRIPE_KEY", "OPENAI_API_KEY",
                     "GITHUB_TOKEN", "SLACK_WEBHOOK", "JWT_SECRET_KEY", "DB_PASSWORD", "PRIVATE_RSA_KEY"]
        prod_paths = ["src/config/production.py", "app/services/aws_s3.py", "backend/database.ts", "config/env.js", "src/auth.py"]
        prod_funcs = ["init_s3_client", "connect_to_production_db", "send_slack_alert", "generate_jwt", "charge_customer"]

        for i in range(100):
            var = prod_vars[i % len(prod_vars)]
            path = prod_paths[i % len(prod_paths)]
            func = prod_funcs[i % len(prod_funcs)]
            samples.append({
                "context": {
                    "variable_name": var,
                    "parent_function_name": func,
                    "parent_class_name": "ProductionConfig" if i % 2 == 0 else "AWSService",
                    "file_path": path,
                    "lines_before": ["# Load credentials from vault or env", f"self.client = boto3.client('s3', secret={var})"],
                    "lines_after": ["self.client.list_buckets()", "logger.info('Connected to S3')"]
                },
                "label": 1  # production_context
            })

        with open(dataset_path, "w", encoding="utf-8") as f:
            json.dump(samples, f, indent=2)
            
        logger.info(f"Synthetic dataset saved to {dataset_path}")
        return str(dataset_path)

    def train(self) -> Dict[str, Any]:
        logger.info("Starting ML model training...")
        dataset_path = self.generate_synthetic_data()
        
        with open(dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        X_raw = [self._extract_text_feature(item["context"]) for item in data]
        y = [item["label"] for item in data]

        self.vectorizer = TfidfVectorizer(ngram_range=(1, 3), max_features=5000)
        X = self.vectorizer.fit_transform(X_raw)

        self.model = LogisticRegression(C=1.0, max_iter=1000)
        self.model.fit(X, y)

        preds = self.model.predict(X)
        acc = float(accuracy_score(y, preds))
        cm = confusion_matrix(y, preds).tolist()

        # Save to disk
        joblib.dump(self.model, settings.MODEL_PATH)
        joblib.dump(self.vectorizer, settings.VECTORIZER_PATH)
        self.is_trained = True

        logger.info(f"ML Model trained successfully. Accuracy: {acc*100:.2f}%")
        return {
            "accuracy": acc,
            "confusion_matrix": cm,
            "total_samples": len(y),
            "model_path": settings.MODEL_PATH
        }

    def load(self) -> bool:
        try:
            if Path(settings.MODEL_PATH).exists() and Path(settings.VECTORIZER_PATH).exists():
                self.model = joblib.load(settings.MODEL_PATH)
                self.vectorizer = joblib.load(settings.VECTORIZER_PATH)
                self.is_trained = True
                logger.info("Loaded trained ML classifier from disk.")
                return True
        except Exception as e:
            logger.error(f"Failed to load ML model from disk: {e}")
        
        logger.info("No valid trained model found on disk. Initializing auto-train...")
        self.train()
        return self.is_trained

    def predict(self, context_dict: Dict[str, Any]) -> Tuple[str, float]:
        if not self.is_trained:
            self.load()

        feature_str = self._extract_text_feature(context_dict)
        X = self.vectorizer.transform([feature_str])
        
        probs = self.model.predict_proba(X)[0]
        prod_prob = float(probs[1])  # Class 1 is production_context
        
        # Fail-secure: If confidence is low or leans production, classify as production
        if prod_prob >= 0.5:
            return "production_context", prod_prob
        else:
            return "mock_test_context", float(probs[0])

ml_classifier = GitUpXClassifier()
