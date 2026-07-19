import re
from typing import List, Dict, Any, Pattern

# Minimum 50 regex patterns covering major cloud providers and SaaS APIs
SECRET_RULES: List[Dict[str, Any]] = [
    # 1. AWS Access Key ID
    {"name": "AWS Access Key ID", "pattern": r"(?i)\b((?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16})\b", "severity": "high"},
    # 2. AWS Secret Key
    {"name": "AWS Secret Key", "pattern": r"(?i)(?:aws_secret_access_key|aws_secret_key|secret_key)\s*(?:=|:)\s*[\"\']?([0-9a-zA-Z\/+]{40})[\"\']?", "severity": "high"},
    # 3. GitHub Classic Personal Access Token
    {"name": "GitHub Classic PAT", "pattern": r"\b(ghp_[0-9a-zA-Z]{36})\b", "severity": "high"},
    # 4. GitHub Fine-Grained Personal Access Token
    {"name": "GitHub Fine-Grained PAT", "pattern": r"\b(github_pat_[0-9a-zA-Z_]{82})\b", "severity": "high"},
    # 5. GitHub OAuth Token
    {"name": "GitHub OAuth Token", "pattern": r"\b(gho_[0-9a-zA-Z]{36})\b", "severity": "high"},
    # 6. GitHub App Token
    {"name": "GitHub App Token", "pattern": r"\b((?:ghu|ghs)_[0-9a-zA-Z]{36})\b", "severity": "high"},
    # 7. GitHub Refresh Token
    {"name": "GitHub Refresh Token", "pattern": r"\b(ghr_[0-9a-zA-Z]{36})\b", "severity": "high"},
    # 8. Slack Token (Bot / User / App / Workspace)
    {"name": "Slack Token", "pattern": r"\b(xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32})\b", "severity": "high"},
    # 9. Slack Webhook URL
    {"name": "Slack Webhook URL", "pattern": r"(https?:\/\/hooks\.slack\.com\/services\/T[0-9a-zA-Z]{8,10}\/B[0-9a-zA-Z]{8,10}\/[0-9a-zA-Z]{24})", "severity": "high"},
    # 10. OpenAI API Key
    {"name": "OpenAI API Key", "pattern": r"\b(sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}|sk-proj-[a-zA-Z0-9_-]{48,64})\b", "severity": "high"},
    # 11. OpenAI Org ID
    {"name": "OpenAI Org ID", "pattern": r"\b(org-[a-zA-Z0-9]{24})\b", "severity": "medium"},
    # 12. Google API Key
    {"name": "Google API Key", "pattern": r"\b(AIza[0-9A-Za-z-_]{35})\b", "severity": "high"},
    # 13. Google OAuth Access Token
    {"name": "Google OAuth Access Token", "pattern": r"\b(ya29\.[0-9A-Za-z_-]+)\b", "severity": "high"},
    # 14. Stripe Live Secret Key
    {"name": "Stripe Live Key", "pattern": r"\b(sk_live_[0-9a-zA-Z]{24,32})\b", "severity": "high"},
    # 15. Stripe Test Secret Key
    {"name": "Stripe Test Key", "pattern": r"\b(sk_test_[0-9a-zA-Z]{24,32})\b", "severity": "medium"},
    # 16. Stripe Live Publishable Key
    {"name": "Stripe Live Publishable Key", "pattern": r"\b(pk_live_[0-9a-zA-Z]{24,32})\b", "severity": "low"},
    # 17. Twilio Account SID
    {"name": "Twilio SID", "pattern": r"\b(AC[a-f0-9]{32})\b", "severity": "medium"},
    # 18. Twilio Auth Token
    {"name": "Twilio Auth Token", "pattern": r"(?i)twilio[a-z0-9_]*\s*(?:=|:)\s*[\"\']?([a-f0-9]{32})[\"\']?", "severity": "high"},
    # 19. SendGrid API Key
    {"name": "SendGrid API Key", "pattern": r"\b(SG\.[0-9A-Za-z-_]{22}\.[0-9A-Za-z-_]{43})\b", "severity": "high"},
    # 20. Mailgun API Key
    {"name": "Mailgun API Key", "pattern": r"\b(key-[0-9a-zA-Z]{32})\b", "severity": "high"},
    # 21. Mailgun Validation Key
    {"name": "Mailgun Validation Key", "pattern": r"\b(pubkey-[0-9a-zA-Z]{32})\b", "severity": "medium"},
    # 22. Heroku API Key
    {"name": "Heroku API Key", "pattern": r"(?i)heroku[a-z0-9_]*\s*(?:=|:)\s*[\"\']?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})[\"\']?", "severity": "high"},
    # 23. Firebase Realtime DB URL
    {"name": "Firebase URL", "pattern": r"(https:\/\/[a-z0-9-]+-default-rtdb\.firebaseio\.com)", "severity": "medium"},
    # 24. Firebase Auth Token
    {"name": "Firebase Auth Token", "pattern": r"(?i)firebase[a-z0-9_]*\s*(?:=|:)\s*[\"\']?([a-zA-Z0-9-_]{40,})[\"\']?", "severity": "high"},
    # 25. RSA Private Key Header
    {"name": "RSA Private Key", "pattern": r"(-----BEGIN RSA PRIVATE KEY-----)", "severity": "high"},
    # 26. DSA Private Key Header
    {"name": "DSA Private Key", "pattern": r"(-----BEGIN DSA PRIVATE KEY-----)", "severity": "high"},
    # 27. EC Private Key Header
    {"name": "EC Private Key", "pattern": r"(-----BEGIN EC PRIVATE KEY-----)", "severity": "high"},
    # 28. OpenSSH Private Key Header
    {"name": "OpenSSH Private Key", "pattern": r"(-----BEGIN OPENSSH PRIVATE KEY-----)", "severity": "high"},
    # 29. PGP Private Key Header
    {"name": "PGP Private Key", "pattern": r"(-----BEGIN PGP PRIVATE KEY BLOCK-----)", "severity": "high"},
    # 30. Generic Private Key Header
    {"name": "Generic Private Key", "pattern": r"(-----BEGIN PRIVATE KEY-----)", "severity": "high"},
    # 31. JWT Token (3 base64url encoded segments separated by dots)
    {"name": "JWT Token", "pattern": r"\b(eyJ[a-zA-Z0-9-_]+\.eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+)\b", "severity": "medium"},
    # 32. Basic Auth in URL
    {"name": "Basic Auth URL", "pattern": r"(https?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", "severity": "high"},
    # 33. PostgreSQL Connection String
    {"name": "Postgres DB URL", "pattern": r"(postgres(?:ql)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9!~*#^()-]+@[a-zA-Z0-9.-]+(?::[0-9]+)?\/[a-zA-Z0-9_-]+)", "severity": "high"},
    # 34. MySQL Connection String
    {"name": "MySQL DB URL", "pattern": r"(mysql:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9!~*#^()-]+@[a-zA-Z0-9.-]+(?::[0-9]+)?\/[a-zA-Z0-9_-]+)", "severity": "high"},
    # 35. MongoDB Connection String
    {"name": "MongoDB URL", "pattern": r"(mongodb(?:\+srv)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9!~*#^()-]+@[a-zA-Z0-9.-]+)", "severity": "high"},
    # 36. DigitalOcean Access Token
    {"name": "DigitalOcean Token", "pattern": r"\b(dop_v1_[a-f0-9]{64})\b", "severity": "high"},
    # 37. Azure Storage Account Key
    {"name": "Azure Storage Key", "pattern": r"(?i)DefaultEndpointsProtocol=[^;]+;AccountName=[^;]+;AccountKey=([a-zA-Z0-9\/+]{86}==)", "severity": "high"},
    # 38. Shopify Access Token
    {"name": "Shopify Access Token", "pattern": r"\b(shpat_[a-fA-F0-9]{32})\b", "severity": "high"},
    # 39. Shopify Private App Password
    {"name": "Shopify Private App Password", "pattern": r"\b(shppa_[a-fA-F0-9]{32})\b", "severity": "high"},
    # 40. NPM Access Token
    {"name": "NPM Access Token", "pattern": r"\b(npm_[a-zA-Z0-9]{36})\b", "severity": "high"},
    # 41. PyPI Upload Token
    {"name": "PyPI API Token", "pattern": r"\b(pypi-AgEIcHlwaS5vcmc[A-Za-z0-9\-_]{50,})\b", "severity": "high"},
    # 42. Discord Bot Token
    {"name": "Discord Bot Token", "pattern": r"\b([MNT][a-zA-Z\d_-]{23,25}\.[a-zA-Z\d_-]{6}\.[a-zA-Z\d_-]{27})\b", "severity": "high"},
    # 43. Telegram Bot Token
    {"name": "Telegram Bot Token", "pattern": r"\b([0-9]{8,10}:[a-zA-Z0-9_-]{35})\b", "severity": "high"},
    # 44. Square Access Token
    {"name": "Square Access Token", "pattern": r"\b(EAAA[a-zA-Z0-9-_]{60})\b", "severity": "high"},
    # 45. LinkedIn Client Secret
    {"name": "LinkedIn Client Secret", "pattern": r"(?i)linkedin[a-z0-9_]*\s*(?:=|:)\s*[\"\']?([a-zA-Z0-9]{16})[\"\']?", "severity": "high"},
    # 46. Mailchimp API Key
    {"name": "Mailchimp API Key", "pattern": r"\b([0-9a-f]{32}-us[0-9]{1,2})\b", "severity": "high"},
    # 47. Datadog API Key
    {"name": "Datadog API Key", "pattern": r"(?i)datadog[a-z0-9_]*\s*(?:=|:)\s*[\"\']?([a-f0-9]{32})[\"\']?", "severity": "high"},
    # 48. New Relic User License Key
    {"name": "New Relic License Key", "pattern": r"\b(NRAK-[A-Z0-9]{27})\b", "severity": "high"},
    # 49. Mapbox Secret Token
    {"name": "Mapbox Secret Token", "pattern": r"\b(sk\.eyJ1Ijoi[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b", "severity": "high"},
    # 50. GitLab Personal Access Token
    {"name": "GitLab PAT", "pattern": r"\b(glpat-[0-9a-zA-Z_-]{20})\b", "severity": "high"},
    # 51. HashiCorp Vault Token
    {"name": "Vault Token", "pattern": r"\b((?:s|hvs)\.[a-zA-Z0-9]{24,32})\b", "severity": "high"},
    # 52. Supabase Service Role Key
    {"name": "Supabase Key", "pattern": r"(?i)supabase[a-z0-9_]*\s*(?:=|:)\s*[\"\']?(eyJ[a-zA-Z0-9-_]+\.eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+)[\"\']?", "severity": "high"}
]

COMPILED_RULES: List[Tuple[str, str, Pattern]] = [
    (rule["name"], rule["severity"], re.compile(rule["pattern"]))
    for rule in SECRET_RULES
]
