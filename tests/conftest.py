import atexit
import os
import sys
import tempfile
from pathlib import Path

import pytest

_task_tmp = Path(__file__).parents[1] / ".tmp"
_task_tmp.mkdir(exist_ok=True)
os.environ["TEMP"] = str(_task_tmp)
os.environ["TMP"] = str(_task_tmp)
tempfile.tempdir = str(_task_tmp)

from gltest.direct import sdk_loader
from gltest.direct.loader import create_address
from gltest.direct.sdk_loader import setup_sdk_paths


tools_root = Path(os.environ.get("GENLAYER_TOOLS_DIR", "E:/Genlayer-Tools"))
sdk_loader.CACHE_DIR = tools_root / "GenVM" / "v0.3.0-rc7"

CONTRACT_PATH = Path(__file__).parents[1] / "contracts" / "regulatory_edition_applicability_lock.py"
setup_sdk_paths(CONTRACT_PATH)


def _sdk_address(seed: str):
    setup_sdk_paths(CONTRACT_PATH)
    return create_address(seed)


@pytest.fixture
def direct_alice():
    return _sdk_address("alice")


@pytest.fixture
def direct_bob():
    return _sdk_address("bob")


@pytest.fixture
def direct_charlie():
    return _sdk_address("charlie")


@pytest.fixture
def direct_owner():
    return _sdk_address("owner")


if os.name == "nt":
    import gltest.direct.loader as _direct_loader

    _original_inject_message = _direct_loader._inject_message_to_fd0
    _original_load_module = _direct_loader._load_module

    def _inject_message_windows_compat(vm):
        try:
            _original_inject_message(vm)
        except PermissionError as error:
            if getattr(error, "winerror", None) != 32:
                raise

    _direct_loader._inject_message_to_fd0 = _inject_message_windows_compat

    def _load_module_with_contract_isolation(contract_path):
        registry = sys.modules.get("genlayer.gl.genvm_contracts")
        if registry is not None:
            registry.__known_contract__ = None
        return _original_load_module(contract_path)

    _direct_loader._load_module = _load_module_with_contract_isolation


_unlink = os.unlink


def _unlink_after_stdin_release(path) -> None:
    try:
        _unlink(path)
    except PermissionError:
        resolved = Path(path).resolve()
        if not resolved.is_relative_to(_task_tmp.resolve()):
            raise
        atexit.register(lambda: resolved.unlink(missing_ok=True))


os.unlink = _unlink_after_stdin_release


@pytest.fixture(autouse=True)
def configure_direct_mode(direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.strict_mocks = True
    direct_vm.check_pickling = True
    direct_vm.warp("2026-08-25T12:00:00+00:00")
    version_pattern = r"ecfr\.gov/api/versioner/v1/versions/title-14\.json(?:\?.*)?$"
    version_response = {"status": 200, "body": '{"content_versions":[{"date":"2024-09-15"},{"date":"2025-09-15"}]}' }
    original_clear_mocks = direct_vm.clear_mocks

    def clear_mocks_with_version_metadata():
        original_clear_mocks()
        direct_vm.mock_web(version_pattern, version_response)

    direct_vm.clear_mocks = clear_mocks_with_version_metadata
    direct_vm.mock_web(version_pattern, version_response)
    yield
