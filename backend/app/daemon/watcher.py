import time
import threading
import platform
from pathlib import Path
from typing import Set, Dict
from app.core.config import settings
from app.core.logger import logger

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logger.warning("psutil not available. Daemon will run in passive interval mode.")

try:
    from plyer import notification
    PLYER_AVAILABLE = True
except ImportError:
    PLYER_AVAILABLE = False

class IDEWatcherDaemon:
    def __init__(self):
        self.monitored_processes = {
            "code.exe", "Code.exe", "cursor.exe", "pycharm64.exe",
            "sublime_text.exe", "electron", "code", "cursor", "pycharm"
        }
        self.running_pids: Set[int] = set()
        self.is_running: bool = False
        self.thread: threading.Thread = None

    def _get_active_ide_pids(self) -> Set[int]:
        pids = set()
        if not PSUTIL_AVAILABLE:
            return pids
        try:
            for proc in psutil.process_iter(["pid", "name"]):
                try:
                    name = proc.info.get("name") or ""
                    if any(mp.lower() in name.lower() for mp in self.monitored_processes):
                        pids.add(proc.info["pid"])
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
        except Exception as e:
            logger.error(f"Error checking process list: {e}")
        return pids

    def _notify_user(self, title: str, message: str):
        logger.info(f"NOTIFICATION: [{title}] {message}")
        if PLYER_AVAILABLE:
            try:
                notification.notify(
                    title=title,
                    message=message,
                    app_name="GitUpX Security",
                    timeout=settings.NOTIFICATION_TIMEOUT_SECONDS
                )
            except Exception as e:
                logger.warning(f"OS notification display failed: {e}")

    def _check_uncommitted_changes(self, repo_path: str) -> bool:
        import subprocess
        try:
            res = subprocess.run(["git", "status", "--porcelain"], cwd=repo_path, capture_output=True, text=True)
            return bool(res.stdout.strip())
        except Exception:
            return False

    def _watch_loop():
        pass

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.running_pids = self._get_active_ide_pids()
        logger.info(f"IDE Watcher Daemon started. Monitoring {len(self.running_pids)} active IDE sessions...")

        def loop():
            while self.is_running:
                try:
                    current_pids = self._get_active_ide_pids()
                    # Check for dead PIDs
                    dead_pids = self.running_pids - current_pids
                    if dead_pids:
                        logger.info(f"Detected closure of IDE session(s): PIDs {dead_pids}")
                        # Check sample repo or registered repos for uncommitted changes
                        sample_repo = str(Path(settings.get_root_dir()) / "test_repo")
                        if Path(sample_repo).exists() and self._check_uncommitted_changes(sample_repo):
                            self._notify_user(
                                "Developer Session Ended",
                                "Uncommitted changes detected! Secure GitUpX Workspace Synchronization is recommended."
                            )
                            # In production, we can auto-trigger decision engine or await user click
                            from app.decision.decision_engine import decision_engine
                            decision_engine.process_repo(sample_repo, user_id=1, triggered_by="daemon")
                    
                    self.running_pids = current_pids
                except Exception as e:
                    logger.error(f"Error in watcher daemon loop: {e}")
                
                time.sleep(settings.WATCH_INTERVAL_SECONDS)

        self.thread = threading.Thread(target=loop, daemon=True, name="GitUpX-IDE-Watcher")
        self.thread.start()

    def stop(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2)
        logger.info("IDE Watcher Daemon stopped.")

watcher_daemon = IDEWatcherDaemon()
