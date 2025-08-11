import numpy as np
import pandas as pd
from scipy.optimize import curve_fit

df = pd.read_csv("output.csv")

x = df['count'].values
y = df['area'].values
z = df['opacity'].values

def model(X, a, b, c, d, e, f):
    x, y = X
    return a + b*x + c*y + d*x*y + e*x**2 + f*y**2

params, cov = curve_fit(model, (x, y), z)

a, b, c, d, e, f = params
print("Fitted formula:")
print(f"opacity = {a:.6f} + {b:.6f} * count + {c:.6f} * area + "
      f"{d:.6f} * count * area + {e:.6f} * (count ** 2) + {f:.6f} * (area ** 2)")

z_pred = model((x, y), *params)
residuals = z - z_pred
std_resid = np.std(residuals, ddof=1)
print(f"Standard deviation of residuals: {std_resid:.6f}")
