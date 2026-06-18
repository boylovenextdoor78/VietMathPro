import matplotlib.pyplot as plt
import numpy as np
import re

class Interval:
    def __init__(self, start, end, start_closed=True, end_closed=True):
        self.start = float(start)
        self.end = float(end)
        self.start_closed = start_closed
        self.end_closed = end_closed

    def __repr__(self):
        s = "[" if self.start_closed else "("
        e = "]" if self.end_closed else ")"
        start_str = "-∞" if self.start == -float('inf') else str(self.start)
        end_str = "+∞" if self.end == float('inf') else str(self.end)
        return f"{s}{start_str}, {end_str}{e}"

def parse_set(s):
    """Parses standard notation like [a, b], (a, b], (-oo, a], etc."""
    s = s.strip().replace(" ", "")
    pattern = r"([\[\(])([-+]?oo|[-+]?\d*\.?\d+),([-+]?oo|[-+]?\d*\.?\d+)([\]\)])"
    match = re.match(pattern, s)
    if not match:
        return None
    
    start_bracket, start_val, end_val, end_bracket = match.groups()
    
    start = -float('inf') if start_val in ["-oo", "oo"] else float(start_val)
    end = float('inf') if end_val in ["+oo", "oo"] else float(end_val)
    
    return Interval(
        start, end, 
        start_closed=(start_bracket == "["), 
        end_closed=(end_bracket == "]")
    )

def intersect(a, b):
    """Intersection of two intervals."""
    start = max(a.start, b.start)
    end = min(a.end, b.end)
    
    if start > end:
        return None
    if start == end:
        if a.start == start and not a.start_closed: return None
        if b.start == start and not b.start_closed: return None
        if a.end == end and not a.end_closed: return None
        if b.end == end and not b.end_closed: return None
        return Interval(start, end, True, True)
    
    start_closed = True
    if start == a.start and not a.start_closed: start_closed = False
    if start == b.start and not b.start_closed: start_closed = False
    
    end_closed = True
    if end == a.end and not a.end_closed: end_closed = False
    if end == b.end and not b.end_closed: end_closed = False
    
    return Interval(start, end, start_closed, end_closed)

def visualize_ruler(sets, result=None, operation_name="Result"):
    """Visualizes sets on the Ox axis using Matplotlib."""
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Determine bounds for plotting
    all_points = []
    for s in sets:
        if s.start != -float('inf'): all_points.append(s.start)
        if s.end != float('inf'): all_points.append(s.end)
    if result:
        if result.start != -float('inf'): all_points.append(result.start)
        if result.end != float('inf'): all_points.append(result.end)
    
    if not all_points:
        min_x, max_x = -10, 10
    else:
        min_x, max_x = min(all_points), max(all_points)
        padding = (max_x - min_x) * 0.2 if max_x != min_x else 2
        min_x -= padding
        max_x += padding

    # Draw Ox Axis
    ax.axhline(0, color='black', linewidth=2)
    ax.annotate('', xy=(max_x, 0), xytext=(min_x, 0),
                arrowprops=dict(arrowstyle="->", color='black', lw=2))
    ax.text(max_x, -0.5, 'Ox', fontsize=12, fontweight='bold')

    # Plot each set
    colors = plt.cm.viridis(np.linspace(0, 1, len(sets)))
    for i, (s, color) in enumerate(zip(sets, colors)):
        y = i + 1
        start = max(min_x, s.start) if s.start == -float('inf') else s.start
        end = min(max_x, s.end) if s.end == float('inf') else s.end
        
        # Draw line
        ax.plot([start, end], [y, y], color=color, linewidth=1.5, label=f"Set {chr(65+i)}")
        
        # Draw endpoints
        if s.start != -float('inf'):
            marker = 'o' if s.start_closed else 'o'
            mfc = color if s.start_closed else 'white'
            ax.plot(s.start, y, marker, color=color, markerfacecolor=mfc, markersize=8)
        
        if s.end != float('inf'):
            marker = 'o' if s.end_closed else 'o'
            mfc = color if s.end_closed else 'white'
            ax.plot(s.end, y, marker, color=color, markerfacecolor=mfc, markersize=8)

    # Plot Result
    if result:
        y_res = len(sets) + 1.5
        start = max(min_x, result.start) if result.start == -float('inf') else result.start
        end = min(max_x, result.end) if result.end == float('inf') else result.end
        
        ax.plot([start, end], [y_res, y_res], color='red', linewidth=2.5, label=operation_name)
        
        if result.start != -float('inf'):
            mfc = 'red' if result.start_closed else 'white'
            ax.plot(result.start, y_res, 'o', color='red', markerfacecolor=mfc, markersize=10)
        
        if result.end != float('inf'):
            mfc = 'red' if result.end_closed else 'white'
            ax.plot(result.end, y_res, 'o', color='red', markerfacecolor=mfc, markersize=10)

    ax.set_ylim(-1, len(sets) + 3)
    ax.set_xlim(min_x, max_x)
    ax.set_yticks([])
    ax.legend()
    ax.set_title("Mode 16: Axis Ox Ruler", fontsize=14, fontweight='bold')
    plt.grid(True, axis='x', linestyle='--', alpha=0.3)
    plt.show()

# Example Usage
if __name__ == "__main__":
    A = parse_set("[2, 7)")
    B = parse_set("(4, 10]")
    if A and B:
        res = intersect(A, B)
        print(f"A: {A}")
        print(f"B: {B}")
        print(f"A ∩ B: {res}")
        # visualize_ruler([A, B], res, "A ∩ B")
