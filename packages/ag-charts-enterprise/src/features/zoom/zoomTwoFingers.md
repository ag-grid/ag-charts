<!--

Open in github.com or compile using Pandoc for more readable format:

  HTML : pandoc -f markdown -t html --standalone --mathjax -o zoomTwoFingers.html zoomTwoFingers.md
  PDF  : pandoc -f markdown -t pdf --pdf-engine=pdflatex -o zoomTwoFingers.pdf zoomTwoFingers.md

-->

## Overview

The `ZoomTwoFingers` class solves the multitouch zoom-pan problem by finding new
X-min, X-max, Y-min, Y-max zoom values such that the fingers are always touching
the same point in the chart. It accomplishes by solving a "two unknowns, two
equations" problem twice (or more generally: it solve a "four unknowns, four
equations" problem, although in practice the zoom values for X and Y axes can be
solved independently).

We can start by finding X-min and X-max because the math is mostly the same for
the Y axis.

Let's first define the series-area as $R$:

$$
\begin{align*}
& R_x : & \textrm{x-position of series-area} \\
& R_y : & \textrm{y-position of series-area} \\
& R_W : & \textrm{width of series-area} \\
& R_H : & \textrm{height of series-area}
\end{align*}
$$

These are all contants in screen pixels.

Let's also define:

-   $x_i \in{[0, N]}$ as the initial normalised value of finger $i$ on the
    current axis.
-   $a_i \in [R_x, R_W]$ as the initial screen value of finger $i$ on the current
    axis.
-   $Z_{min}, Z_{max} \in [0, 1]$ as the initial normalised zoom values on the current
    axis.

$N$ is typically $1$, but it can be set to a higher value for more precision.

Note that, in the interest of simplicity, the assumption here is that fingers
will always stay with bounds the series-area. In practice however the user can
drag fingers outside the series-area, so the production code will need to clamp
screen values.

## Start

Our inputs $R$, $a_1$, $a_2$, $Z_{min}$, $Z_{max}$ are all known when we receive
the first `'touchstart'` event with two fingers.
The $x_1$, and $x_2$ values can calculated using interpolation:

$$
\begin{equation}
x_i = N \cdot \left( \frac{a_i - R_x}{R_W} (Z_{max} - Z_{min}) + Z_{min} \right) \qquad i \in \{1, 2\}
\end{equation}
$$

This forms the basis of the "two unknown, two equations" problem. As the fingers
move on the screen, their $a_i$ screen values will inevitably change. Our
objective is ensure the $x_i$ values remain constant.

## Move

Our only inputs when receive `'touchmove'` event is $R$ (series-rect), which is
should be unchanged, and $a\prime_1, a\prime_2 \in [R_x, R_W]$, the new screen values of
the two fingers on the current axis.

Our desired outputs are $Z\prime_{min}, Z\prime_{max} \in [0, 1]$, the new normalised zoom
values on the current axis.

The interpolation logic is the same during a `'touchmove'` event:

$$
\begin{equation}
x\prime_i = N \cdot \left( \frac{a\prime_i - R_x}{R_W} (Z\prime_{max} - Z\prime_{min}) + Z\prime_{min} \right) \qquad i \in \{1, 2\}
\end{equation}
$$

We want the fingers to keep touching the same point on the chart. This means
that we need to find $(Z\prime_{min}, Z\prime_{max})$ such that $x_i = x\prime_i$.

Fortunately, we have two fingers. This gives us two equations with the two
unknowns $(Z\prime_{min}, Z\prime_{max})$ that we are looking for:

$$
\begin{align*}
x_1 &= N \cdot \left( \frac{a\prime_1 - R_x}{R_W} (Z\prime_{max} - Z\prime_{min}) + Z\prime_{min} \right) \qquad (1) \\
x_2 &= N \cdot \left( \frac{a\prime_2 - R_x}{R_W} (Z\prime_{max} - Z\prime_{min}) + Z\prime_{min} \right) \qquad (2) \\
\end{align*}
$$

Which we can rewrite as:

$$
\begin{align*}
x_1 &= t_1 (Z\prime_{max} - Z\prime_{min}) +  N \cdot Z\prime_{min} \qquad (1) \\
x_2 &= t_2 (Z\prime_{max} - Z\prime_{min}) +  N \cdot Z\prime_{min} \qquad (2) \\ \\
\textrm{where }t_i &=  N \cdot \frac{a\prime_i - R_x}{R_W}
\end{align*}
$$

We can use equation $(2)$ to express $Z\prime_{max}$ in terms of $Z\prime_{min}$:

$$
\begin{align*}
x_2 &= t_2 (Z\prime_{max} - Z\prime_{min}) + N \cdot Z\prime_{min} \\
x_2 &= t_2 Z\prime_{max} - t_2 Z\prime_{min} +  N \cdot Z\prime_{min} \\
x_2 &= t_2 Z\prime_{max} - (t_2 - N) Z\prime_{min} \\
x_2 + (t_2 - N) Z\prime_{min} &= t_2 Z\prime_{max} \\
\therefore
Z\prime_{max} &= \frac{x_2 + (t_2 - N) Z\prime_{min}}{t_2} \\
\end{align*}
$$

Now we can substitue $Z\prime_{max}$ into equation $(1)$:

$$
\begin{align*}
x_1                &= t_1 (Z\prime_{max} - Z\prime_{min}) + N \cdot Z\prime_{min} \\
x_1                &= t_1 Z\prime_{max} - t_1 Z\prime_{min} + N \cdot Z\prime_{min} \\
x_1 - t_1 Z\prime_{max} &= -t_1 Z\prime_{min} + N \cdot Z\prime_{min} \\
                   &= (N - t_1) Z\prime_{min} \\
x_1 - t_1 \frac {x_2 + (t_2 - N) Z\prime_{min}} {t_2} &= (N - t_1) Z\prime_{min} \\
x_1 - \frac{t_1}{t_2} x_2 - \frac{t_1}{t_2} (t_2 - N) Z\prime_{min} &=  (N - t_1) Z\prime_{min} \\
x_1 - \frac{t_1}{t_2} x_2 &=  (N - t_1) Z\prime_{min} + \frac{t_1}{t_2} (t_2 -1) Z\prime_{min} \\
\end{align*}
$$

Let $c = \frac{t_1}{t_2}$

$$
\begin{align*}
x_1 - c \cdot x_2 &=  (N - t_1) Z\prime_{min} + c \cdot (t_2 - N) Z\prime_{min} \\
x_1 - c \cdot x_2 &=  Z\prime_{min} ( (N - t_1) + c \cdot (t_2 - N) ) \\
\therefore
Z\prime_{min} &= \frac{x_1 - c \cdot x_2}{N - t_1 + c \cdot (t_2 - N)} \\
\end{align*}
$$

## Y Axis
For the Y axis, the math is exactly the same. The only caveat for the Y axis is
that 0 is the bottom in normalised coords and 0 is the top in screen
coords. Therefore, the values must be flipped to account for this.

We can solve the use Y-min and Y-max values by substituting these inputs for the
X-min and X-max computation:

$$
\begin{align*}
R_x &:= R_y \\
R_W &:= R_H \\
x_i &:= y_i \\
a\prime_i &:= (R_H + R_y) - b'_i
\end{align*}
$$

Where $y_i \in{[0, 1]}$ and $b'_i \in [R_y, R_H]$ are the normalised and screen
values of finger $i$ on the Y axis.

