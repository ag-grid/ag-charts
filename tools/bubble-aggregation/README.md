# Bubble Aggregation

Computes an approximate opacity formula for bubble aggregation.

```
node index.mjs > output.csv
```

-   `data.mjs` - one or more datasets to use
-   `aggregation.mjs` - should copy logic from bubble series aggregation logic
-   `canvas.mjs` - draws a node in the aggregation, and measures the average opacity
-   `index.mjs` - outputs the average opacities per aggregation node in a CSV

To curve fit, set up Python

```
python3 -m venv myenv
source myenv/bin/activate
python3 -m pip install --upgrade pip setuptools wheel
pip install scipy numpy pandas
```

Then run,

```
python3 fit.py
```

-   `fit.py` - runs curve fitting on `output.csv` and outputs an equation (& standard deviation)
