import dash
from dash import d_core_components as dcc
from dash import d_html_components as html
from dash.dependencies import Input, Output, State
import plotly.graph_objs as go
import numpy as np

# ==============================================================================
# GeoGebra 4D Manifold Tesseract Simulator (Dash Version)
# ==============================================================================
# Tài liệu tham khảo:
# - https://github.com/tsherif/tesseract-explorer (4D projection technique)
# - Plotly Python 3D documentation (interactive scatter, surface)
# - Tesseract visualization papers (4D -> 3D orthogonal + perspective)
# ==============================================================================

app = dash.Dash(__name__, external_stylesheets=['https://codepen.io/chriddyp/pen/bWLwgP.css'])

# Layout ứng dụng
app.layout = html.Div([
    html.Div([
        html.H2("GeoGebra 4D Manifold Tesseract Simulator", style={'fontFamily': 'serif', 'fontStyle': 'italic', 'color': '#e11d48'}),
        html.P("Hệ thống mô phỏng đa tạp 4D tương tác - Chế độ GeoGebra 6.x", style={'fontSize': '12px', 'opacity': 0.6})
    ], style={'textAlign': 'center', 'padding': '20px', 'borderBottom': '1px solid #eee'}),

    html.Div([
        # Panel điều khiển (Bên trái)
        html.Div([
            html.H4("Hàm số Manifold", style={'fontSize': '14px', 'fontWeight': 'bold'}),
            html.Label("f(x) - 2D"),
            dcc.Input(id='fx_input', type='text', value='sin(x) * exp(-x^2/4)', style={'width': '100%'}),
            html.Label("f(x, y) - 3D"),
            dcc.Input(id='fxy_input', type='text', value='2 * cos(sqrt(x^2 + y^2)) / (1 + 0.1*(x^2 + y^2))', style={'width': '100%'}),
            html.Label("f(x, y, z) - 4D"),
            dcc.Input(id='fxyz_input', type='text', value='sin(x) * cos(y) * sin(z)', style={'width': '100%'}),
            
            html.Hr(),
            html.H4("Tham số Vật lý", style={'fontSize': '14px', 'fontWeight': 'bold'}),
            
            html.Label("Độ phân giải (Resolution)"),
            dcc.Slider(id='res_slider', min=10, max=100, step=1, value=30),

            html.Label("ε (Biến dạng)"),
            dcc.Slider(id='epsilon', min=0, max=1, step=0.01, value=0.2, marks={0: '0', 1: '1'}),
            
            html.Label("k (Hyperbolic)"),
            dcc.Slider(id='k_val', min=0.1, max=5, step=0.1, value=1.0),
            
            html.Label("λ₀ (Fractal)"),
            dcc.Slider(id='lambda0', min=0, max=3, step=0.1, value=1.0),
            
            html.Label("r5 (KK Radius)"),
            dcc.Slider(id='r5_val', min=0.1, max=2, step=0.1, value=0.5),
            
            html.Hr(),
            html.H4("Lớp biến dạng", style={'fontSize': '14px', 'fontWeight': 'bold'}),
            dcc.Checklist(
                id='layers',
                options=[
                    {'label': ' Hyperbolic', 'value': 'hyp'},
                    {'label': ' Kaluza-Klein', 'value': 'kk'},
                    {'label': ' String Modes', 'value': 'str'},
                    {'label': ' Fractal Coupling', 'value': 'frac'}
                ],
                value=['hyp', 'kk', 'str', 'frac'],
                style={'fontSize': '12px'}
            ),
            
            html.Hr(),
            html.Button("Reset View", id='reset-btn', n_clicks=0, style={'width': '100%', 'backgroundColor': '#141414', 'color': 'white'})
        ], className="three columns", style={'padding': '20px', 'backgroundColor': '#f9f9f9', 'minHeight': '800px'}),

        # Panel hiển thị (Bên phải)
        html.Div([
            dcc.Tabs(id="tabs", value='tab-4d', children=[
                dcc.Tab(label='Môi trường 2D', value='tab-2d'),
                dcc.Tab(label='Môi trường 3D', value='tab-3d'),
                dcc.Tab(label='Môi trường 4D Projection', value='tab-4d'),
            ]),
            html.Div(id='tabs-content')
        ], className="9 columns")
    ], className="row")
])

# Logic tính toán 4D -> 3D
def project_4d_to_3d(x, y, z, w, theta=0.6, phi=0.8, scale=0.4):
    # Xoay 4D (xw và yw planes)
    x2 = x * np.cos(theta) - w * np.sin(theta)
    w2 = x * np.sin(theta) + w * np.cos(theta)
    y2 = y * np.cos(phi) - w2 * np.sin(phi)
    w3 = y * np.sin(phi) + w2 * np.cos(phi)
    
    # Perspective projection
    factor = 1 + scale * w3
    return x2 * factor, y2 * factor, z * factor, w3

@app.callback(Output('tabs-content', 'children'),
              [Input('tabs', 'value'),
               Input('fx_input', 'value'),
               Input('fxy_input', 'value'),
               Input('fxyz_input', 'value'),
               Input('res_slider', 'value'),
               Input('epsilon', 'value'),
               Input('k_val', 'value'),
               Input('lambda0', 'value'),
               Input('r5_val', 'value'),
               Input('layers', 'value')],
              [State('tabs-content', 'children')])
def render_content(tab, fx_str, fxy_str, fxyz_str, res, eps, k, lam0, r5, layers, current_content):
    # Mặc định phạm vi
    domain_range = 5
    
    # Tạo lưới dữ liệu
    u = np.linspace(-domain_range, domain_range, res)
    v = np.linspace(-domain_range, domain_range, res)
    
    # Evaluate functions safely
    try:
        if tab == 'tab-2d':
            u_long = np.linspace(-domain_range, domain_range, res * 4)
            safe_fx = fx_str.replace('^', '**').replace('exp', 'np.exp').replace('sin', 'np.sin').replace('cos', 'np.cos').replace('sqrt', 'np.sqrt')
            Y = eval(safe_fx, {"np": np, "x": u_long})
            fig = go.Figure(data=[go.Scatter(x=u_long, y=Y, mode='lines', line=dict(color='#e11d48', width=3))])
            fig.update_layout(title="2D Cartesian Environment (f(x))", xaxis_title="Ox", yaxis_title="Oy", 
                              xaxis=dict(range=[-domain_range, domain_range]),
                              yaxis=dict(scaleanchor="x", scaleratio=1))
            return dcc.Graph(id='graph-2d', figure=fig, style={'height': '700px'})

        elif tab == 'tab-3d':
            U, V = np.meshgrid(u, v)
            X, Y = U.flatten(), V.flatten()
            safe_fxy = fxy_str.replace('^', '**').replace('exp', 'np.exp').replace('sin', 'np.sin').replace('cos', 'np.cos').replace('sqrt', 'np.sqrt')
            Z = eval(safe_fxy, {"np": np, "x": X, "y": Y})
            
            # Apply deformations
            R = np.sqrt(X**2 + Y**2 + Z**2)
            DZ = 0
            if 'hyp' in layers: DZ += eps * np.sinh(k * R)
            if 'kk' in layers: DZ += Z * (np.exp(-(r5**2) / 2.0) * eps)
            Z_def = Z + DZ
            Z_grid = Z_def.reshape(res, res)
            
            fig = go.Figure(data=[go.Surface(x=u, y=v, z=Z_grid, colorscale='Plasma', showscale=False, opacity=0.9)])
            fig.update_layout(title="3D Cartesian Environment (Continuous Surface)", 
                              scene=dict(xaxis_title="x", yaxis_title="y", zaxis_title="z",
                                         xaxis=dict(range=[-domain_range, domain_range]),
                                         yaxis=dict(range=[-domain_range, domain_range]),
                                         aspectmode='manual', aspectratio=dict(x=1, y=1, z=1)))
            return dcc.Graph(id='graph-3d', figure=fig, style={'height': '700px'})

        else:
            # 4D: Hyper-mesh slices
            slice_count = 8
            w_slices = np.linspace(-domain_range, domain_range, slice_count)
            U, V = np.meshgrid(u, v)
            X, Y = U.flatten(), V.flatten()
            safe_fxyz = fxyz_str.replace('^', '**').replace('exp', 'np.exp').replace('sin', 'np.sin').replace('cos', 'np.cos').replace('sqrt', 'np.sqrt')
            
            traces = []
            for i, zi_coord in enumerate(w_slices):
                W = eval(safe_fxyz, {"np": np, "x": X, "y": Y, "z": zi_coord})
                Z = np.full_like(X, zi_coord)
                
                # Apply deformations
                R = np.sqrt(X**2 + Y**2 + Z**2 + W**2)
                DX, DY, DZ, DW = 0, 0, 0, 0
                if 'hyp' in layers:
                    hyp = eps * np.sinh(k * R)
                    DX += hyp; DY += hyp; DZ += hyp; DW += np.cosh(k * R) * eps
                if 'kk' in layers:
                    kk = np.exp(-(r5**2) / 2.0) * eps
                    DX += X * kk; DY += Y * kk; DZ += Z * kk; DW += W * kk
                
                X_def, Y_def, Z_def, W_def = X + DX, Y + DY, Z + DZ, W + DW
                PX, PY, PZ, _ = project_4d_to_3d(X_def, Y_def, Z_def, W_def)
                
                traces.append(go.Scatter3d(x=PX, y=PY, z=PZ, mode='lines', 
                                           line=dict(color=f'rgba(255, {int(255*i/slice_count)}, 50, 0.6)', width=2),
                                           name=f'Slice {i}'))

            # Vẽ hệ trục 4D
            scale_ax = domain_range * 1.5
            axes_defs = [([scale_ax, 0, 0, 0], 'blue', 'Ox', 'solid'),
                         ([0, scale_ax, 0, 0], 'green', 'Oy', 'solid'),
                         ([0, 0, scale_ax, 0], 'orange', 'Oz', 'solid'),
                         ([0, 0, 0, scale_ax], 'red', 'Ot', 'dash')]
            for p, color, label, dash in axes_defs:
                ax, ay, az, _ = project_4d_to_3d(p[0], p[1], p[2], p[3])
                traces.append(go.Scatter3d(x=[0, ax], y=[0, ay], z=[0, az], mode='lines+text',
                                           line=dict(color=color, width=5, dash=dash),
                                           text=['', label], name=label, showlegend=False))

            fig = go.Figure(data=traces)
            fig.update_layout(title="4D Projection Environment (Hyper-Mesh Slices)", 
                              scene=dict(xaxis_title="x'", yaxis_title="y'", zaxis_title="z'",
                                         aspectmode='manual', aspectratio=dict(x=1, y=1, z=1)))
            return dcc.Graph(id='graph-4d', figure=fig, style={'height': '700px'})
            
    except Exception as e:
        print(f"Eval error: {e}")
        return html.Div(f"Lỗi tính toán: {str(e)}", style={'color': 'red', 'padding': '20px'})
            
    except Exception as e:
        print(f"Eval error: {e}")
        return html.Div(f"Lỗi tính toán: {str(e)}", style={'color': 'red', 'padding': '20px'})

if __name__ == '__main__':
    app.run_server(debug=True, port=8050)
