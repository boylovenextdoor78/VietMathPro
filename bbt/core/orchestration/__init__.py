# -*- coding: utf-8 -*-
"""
Orchestration layer coordinates query dispatching, capability mappings, and fallback triggers.
"""

from .dispatcher import Dispatcher, ExecRouter, CapabilityMap

__all__ = ["Dispatcher", "ExecRouter", "CapabilityMap"]
