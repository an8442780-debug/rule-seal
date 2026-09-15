import atexit
import json
import os
import sys
import tempfile
from pathlib import Path
import importlib

import pytest

_task_tmp = Path(__file__).parents[1] / ".tmp"
_task_tmp.mkdir(exist_ok=True)
os.environ["TEMP"] = str(_task_tmp)
os.environ["TMP"] = str(_task_tmp)
tempfile.tempdir = str(_task_tmp)

from gltest.direct import sdk_loader
from gltest.direct.loader import create_address
from gltest.direct.sdk_loader import setup_sdk_paths


_project_genvm_cache = Path(__file__).parents[1] / ".genvm-cache"
_tool_genvm_cache = Path(r"E:\Genlayer-Tools\GenVM\v0.3.0-rc7")
_genvm_version = os.environ.get("GENVM_VERSION", "v0.6.0-rc5")
_genvm_filename = f"genvm-universal-{_genvm_version}.tar.xz"
sdk_loader.CACHE_DIR = (
    _project_genvm_cache
    if (_project_genvm_cache / "bundles-v2" / _genvm_filename).exists()
    else _tool_genvm_cache
)
if hasattr(sdk_loader, "BUNDLE_CACHE_DIR"):
    sdk_loader.BUNDLE_CACHE_DIR = sdk_loader.CACHE_DIR / "bundles-v2"
    sdk_loader.TREE_CACHE_DIR = sdk_loader.CACHE_DIR / "trees-v2"
os.environ.setdefault("GENVM_VERSION", "v0.6.0-rc5")
_genvm_version = os.environ["GENVM_VERSION"]

CONTRACT_PATH = Path(__file__).parents[1] / "contracts" / "rule_seal.py"
setup_sdk_paths(CONTRACT_PATH, version=_genvm_version)

# The RC Direct Mode loader adds the SDK but not the runner's cloudpickle
# dependency. Load that dependency from the same pinned GenVM bundle.
_genvm_bundle = sdk_loader.download_artifacts(_genvm_version)
_runner_dir = sdk_loader.extract_runner(
    _genvm_bundle,
    sdk_loader.RUNNER_TYPE,
    sdk_loader.parse_contract_header(CONTRACT_PATH)[sdk_loader.RUNNER_TYPE],
    _genvm_version,
)
_cloudpickle_hash = sdk_loader.parse_runner_manifest(_runner_dir)["py-lib-cloudpickle"]
_cloudpickle_dir = sdk_loader.extract_runner(
    _genvm_bundle, "py-lib-cloudpickle", _cloudpickle_hash, _genvm_version
)
_cloudpickle_path = _cloudpickle_dir / "src"
sys.path.insert(0, str(_cloudpickle_path if _cloudpickle_path.exists() else _cloudpickle_dir))

# Current SDK imports the WASI primitive only inside GenVM. Direct Mode installs
# the same primitive at runtime, so bind it explicitly for host-side tests.
from gltest.direct import wasi_mock as _wasi_mock

_sdk_gl_call = importlib.import_module("genlayer._internal.on_chain.gl_call")
if not hasattr(_sdk_gl_call, "_imp_raw"):
    _sdk_gl_call._imp_raw = _wasi_mock.gl_call

# Direct Mode synchronizes only already-loaded message modules.
import genlayer.message


def _sdk_address(seed: str):
    setup_sdk_paths(CONTRACT_PATH, version=_genvm_version)
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
        registry = sys.modules.get("genlayer.contract")
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
    genlayer.message.raw = direct_vm.get_message_raw()
    original_mock_llm = direct_vm.mock_llm

    def mock_llm_text(pattern, response):
        # RC Testing Suite eagerly JSON-decodes string mocks, while the v0.3
        # SDK decodes the nondeterministic JSON text itself.
        if isinstance(response, str):
            response = json.dumps(response)
        return original_mock_llm(pattern, response)

    direct_vm.mock_llm = mock_llm_text
    yield
