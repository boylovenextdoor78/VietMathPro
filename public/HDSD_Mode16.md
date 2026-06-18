<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HDSD_Mode16_VietMathPro</title>

<style>
:root{
  --text:#111;
  --muted:#666;
  --border:#ddd;
  --bg:#f6f6f6;
  --box:#fafafa;
}

@page {
  size: A4;
  margin: 20mm;
}

body{
  font-family: Arial, Helvetica, sans-serif;
  color: var(--text);
  line-height: 1.65;
  font-size: 14px;
  margin: 0;
  background: white;
}

.container{
  max-width: 820px;
  margin: auto;
  padding: 24px;
}

h1{
  text-align:center;
  font-size: 24px;
  margin: 0;
}

h1 + h1{
  font-size: 18px;
  margin-top: 4px;
  margin-bottom: 18px;
}

h2{
  font-size: 18px;
  margin-top: 28px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

p{ margin: 10px 0; }

code{
  background: var(--bg);
  padding: 3px 6px;
  border-radius: 5px;
  font-family: Consolas, monospace;
  font-size: 13px;
  white-space: pre-wrap;
}

/* FIX DISPLAY FOR BACKSLASH INSIDE TEXT */
.math{
  font-family: Consolas, monospace;
  background: var(--bg);
  padding: 3px 6px;
  border-radius: 5px;
}

.box{
  background: var(--box);
  border-left: 4px solid #222;
  padding: 12px 14px;
  margin: 14px 0;
}

ul, ol{
  padding-left: 22px;
}

.footer{
  margin-top: 40px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}

.print-btn{
  position: fixed;
  top: 12px;
  right: 12px;
  padding: 10px 14px;
  border: none;
  background: #111;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}

@media print{
  .print-btn{ display:none; }
}
</style>
</head>

<body>

<button class="print-btn" onclick="window.print()">Xuất PDF</button>

<div class="container">

<h1>HƯỚNG DẪN SỬ DỤNG VIETMATH PRO</h1>
<h1>MODE 16 (AXIS OX RULER)</h1>

<p>
Mode 16 hỗ trợ xử lý Đại số tập hợp và Logic Boolean trên trục số thực Ox.
</p>

<h2>I. CÚ PHÁP TẬP HỢP</h2>

<ul>
<li>Đoạn đóng: <code>[a,b]</code></li>
<li>Khoảng mở: <code>(a,b)</code></li>
<li>Nửa khoảng: <code>[a,b)</code>, <code>(a,b]</code></li>
<li>Điểm đơn: <code>{a}</code></li>
<li>Vô cực: <code>+oo</code>, <code>-oo</code>, <code>∞</code></li>
<li>Tập rỗng: <code>∅</code></li>
</ul>

<h2>II. PHÉP TOÁN</h2>

<ol>
<li>Intersection (∩)</li>
<li>Union (∪)</li>
<li>Difference (&#92;)</li>
<li>Complement</li>
<li>Subset (⊆)</li>
</ol>

<h2>III. CUSTOM FORMULA</h2>

<ul>
<li>Union: ∪, U, ||</li>
<li>Intersection: ∩, &, &&</li>
<li>Difference: <span class="math">&#92;</span>, MINUS</li>
<li>Subset: ⊆, ⊂</li>
<li>Belong: ∈</li>
</ul>

<div class="box">
<b>Ví dụ 1</b><br><br>

<span class="math">
([2,7) ∪ ((-3,5] ∩ (-11,-8))) &#92; {3}
</span>

<br><br>Kết quả:<br>
<code>[2,3) ∪ (3,7)</code>
</div>

<div class="box">
<b>Ví dụ 2</b><br><br>

<span class="math">((A ∪ B) ∩ C) ⊆ ℝ</span><br><br>

Kết quả:<br>
TRUE / FALSE
</div>

<h2>IV. HIỂN THỊ</h2>

<ul>
<li>Interval output</li>
<li>Boolean TRUE/FALSE</li>
<li>Trục Ox trực quan</li>
<li>● / ○ điểm đóng mở</li>
</ul>

<h2>V. XUẤT PDF</h2>

<ol>
<li>Mở bằng Chrome</li>
<li>Click Xuất PDF</li>
<li>Save as PDF</li>
</ol>

<div class="footer">
VietMath Pro — Mode 16 Safe Build
</div>

</div>

</body>
</html>