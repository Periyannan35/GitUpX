import os
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from app.core.logger import logger

try:
    from github import Github, GithubException
    PYGITHUB_AVAILABLE = True
except ImportError:
    PYGITHUB_AVAILABLE = False
    logger.warning("PyGithub not found. Using subprocess git fallback.")

class GitHubPublisher:
    def __init__(self):
        pass

    def push_repo(self, repo_path: str, github_token: Optional[str], repo_name: str, branch: str = "main") -> Dict[str, Any]:
        result = {
            "commit_hash": "",
            "push_status": "failed",
            "remote_url": "",
            "message": ""
        }

        root = Path(repo_path)
        if not root.exists():
            result["message"] = f"Repository path {repo_path} does not exist."
            return result

        try:
            # 1. Ensure git is initialized
            if not (root / ".git").exists():
                subprocess.run(["git", "init"], cwd=root, check=True, capture_output=True)
                subprocess.run(["git", "branch", "-M", branch], cwd=root, check=True, capture_output=True)

            # 2. Check/Create GitHub repository via PyGithub if token provided
            remote_url = ""
            if github_token and PYGITHUB_AVAILABLE:
                try:
                    gh = Github(github_token)
                    user = gh.get_user()
                    try:
                        remote_repo = user.get_repo(repo_name)
                        remote_url = remote_repo.clone_url
                        logger.info(f"Found existing GitHub repository: {remote_url}")
                    except GithubException as ge:
                        if ge.status == 404:
                            logger.info(f"Creating new private GitHub repository: {repo_name}")
                            remote_repo = user.create_repo(
                                name=repo_name,
                                private=True,
                                description="Secured and auto-published by GitUpX"
                            )
                            remote_url = remote_repo.clone_url
                        else:
                            raise ge
                except Exception as gh_e:
                    logger.warning(f"GitHub API interaction failed: {gh_e}. Will check local remote URL.")

            # Get local remote if not found from PyGithub
            if not remote_url:
                rem_res = subprocess.run(["git", "config", "--get", "remote.origin.url"], cwd=root, capture_output=True, text=True)
                if rem_res.stdout.strip():
                    remote_url = rem_res.stdout.strip()
            
            result["remote_url"] = remote_url

            # Set remote origin if token and URL available
            if remote_url and github_token and "https://" in remote_url:
                auth_url = remote_url.replace("https://", f"https://oauth2:{github_token}@")
                subprocess.run(["git", "remote", "remove", "origin"], cwd=root, capture_output=True)
                subprocess.run(["git", "remote", "add", "origin", auth_url], cwd=root, capture_output=True)

            # 3. Stage all changes
            subprocess.run(["git", "add", "."], cwd=root, check=True, capture_output=True)

            # 4. Check if there is anything to commit
            status_res = subprocess.run(["git", "status", "--porcelain"], cwd=root, capture_output=True, text=True)
            if not status_res.stdout.strip():
                result["push_status"] = "up_to_date"
                result["message"] = "No changes to commit. Working tree clean."
                logger.info("Working tree clean, skipping commit and push.")
                return result

            # 5. Commit with Signed-off-by (GPG sign simulation)
            commit_msg = f"GitUpX: sanitized secrets and auto-published [secure-commit]"
            commit_res = subprocess.run(
                ["git", "commit", "-s", "-m", commit_msg],
                cwd=root, check=True, capture_output=True, text=True
            )
            logger.info(f"Git commit created: {commit_msg}")

            # Get latest commit hash
            hash_res = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True, check=True)
            result["commit_hash"] = hash_res.stdout.strip()[:8]

            # 6. Push to remote
            if remote_url:
                push_res = subprocess.run(
                    ["git", "push", "-u", "origin", branch, "--force-with-lease"],
                    cwd=root, capture_output=True, text=True
                )
                if push_res.returncode == 0:
                    result["push_status"] = "success"
                    result["message"] = f"Successfully pushed to {remote_url} (branch {branch})"
                    logger.info(f"Successfully pushed repo {repo_name} to GitHub.")
                else:
                    # Retry simple push if force-with-lease fails on new repo
                    push_retry = subprocess.run(["git", "push", "-u", "origin", branch], cwd=root, capture_output=True, text=True)
                    if push_retry.returncode == 0:
                        result["push_status"] = "success"
                        result["message"] = f"Successfully pushed to {remote_url}"
                    else:
                        result["push_status"] = "failed"
                        result["message"] = f"Git push failed: {push_retry.stderr}"
                        logger.error(f"Git push failed: {push_retry.stderr}")
            else:
                result["push_status"] = "local_only"
                result["message"] = "Committed locally. No remote GitHub URL configured."

        except Exception as e:
            result["push_status"] = "error"
            result["message"] = str(e)
            logger.error(f"Error during push_repo for {repo_path}: {e}")

        return result

github_publisher = GitHubPublisher()
