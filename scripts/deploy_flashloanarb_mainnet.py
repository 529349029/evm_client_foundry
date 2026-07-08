#!/usr/bin/env python3
"""BSC 主网 FlashLoanArb 部署脚本（用 ape 直接部署）。

用法：
    source /home/administrator/projects/python_first/.venv/bin/activate
    cd /home/administrator/workspace/evm_client_python1
    python scripts/deploy_flashloanarb.py
"""
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# ─── BSC extraData 兼容补丁 ───
import web3.manager as _w3m
from web3.middleware import ExtraDataToPOAMiddleware
_orig_init = _w3m.RequestManager.__init__

def _patched_init(self, w3, provider, middleware=None, **kwargs):
    _orig_init(self, w3, provider, middleware, **kwargs)
    self.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

_w3m.RequestManager.__init__ = _patched_init

from ape import Contract, networks, accounts, project

# ─── 配置 ───
WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
SIGNER_ALIAS = "test4"
PASSWORD = "1191372769"

# V2 手续费参数（与 .env 的 GLOBAL_UNI_FEE 对齐）
V2_FEE = 9975
V2_FEE_DENOM = 10000


def main():
    signer = accounts.load(SIGNER_ALIAS)
    signer.set_autosign(True, passphrase=PASSWORD)
    print(f"[INFO] Signer: {signer.address}")

    with networks.bsc.mainnet.use_provider("node") as provider:
        # 1. 部署 FlashLoanArb（无构造函数参数）
        print("[1/3] Deploying FlashLoanArb...")
        FlashLoanArb = project.FlashLoanArb
        tx = signer.deploy(
            FlashLoanArb,
            gas=5_000_000,
        )
        flashloanarb = tx  # ape deploy 返回的就是合约实例
        print(f"[OK] FlashLoanArb deployed at: {flashloanarb.address}")


if __name__ == "__main__":
    main()