# -*- coding: utf-8 -*-
"""
Decoupled bridges translating symbolic requests into specific CAS API calls.
"""

from .sympy_bridge import SympyBridge
from .giac_bridge import GiacBridge

__all__ = ["SympyBridge", "GiacBridge"]
