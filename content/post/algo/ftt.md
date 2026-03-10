---
title: '多项式乘法 —— FFT（快速傅里叶变换）'
description: '本文介绍用于加速多项式乘法计算的 FFT 快速傅里叶变换'
pubDate: '2026-03-09'
draft: false
---

参考
- https://www.bilibili.com/video/BV1za411F76U
- https://www.bilibili.com/video/BV1Le4y1V78D

---


### 多项式

$a(x) = a_0 + a_1x+a_2x^2 + ... + a_{n-1}x^{n-1} =\sum_{i=0}^{n-1} a_i x^i\\ b(x) = b_0 +b_1x+b_2x^2 + ... + b_{n-1}x^{n-1} =\sum_{i=0}^{n-1} b_i x^i$

多项式存在一个性质：如果最高项为 $x^{n-1}$ ，那么至少 n 个不同的点就可以确定一个多项式。

比如：一次函数可以用两个点唯一确定，二次函数可以用三个点唯一确定。

&nbsp;

### 多项式乘法

多项式相乘有两种方法：系数乘法和点值乘法。

系数相乘：$c(x) = a(x)b(x) = \sum_{k=0}^{2n-2} c_k x^k$，其中 $c_k = \sum_{i+j=k}a_ib_j$

&nbsp;

除此之外，根据“点确定多项式”这个方式，可以找到另一种乘法：点值相乘。

乘积最高项为 2n-2，用至少 2n-1 个点可以确定，因此在两个多项式分别找到 2n - 1 个点。

取 $[x_0,x_1,x_2,...,x_{2n-2}]$ 分别代入两个多项式：

$\begin{bmatrix}
a(x_0)\\
a(x_1)  \\
a(x_2) \\
... \\
a(x_{2n-2})
\end{bmatrix} = 
\begin{bmatrix}
1 & x_0 &x_0^2&...&x_0^{2n-2} \\
1&x_1&x_1^2&...&x_1^{2n-2} \\
1&x_2&x_2^2&...&x_2^{2n-2} \\
... \\
1&x_{2n-2}&x_{2n-2}^2&...&x_{2n-2}^{2n-2}\
\end{bmatrix}
\begin{bmatrix}
a_0\\a_1\\a_2\\...\\a_{2n-2}
\end{bmatrix}$

$\begin{bmatrix}
b(x_0)\\
b(x_1)  \\
b(x_2) \\
... \\
b(x_{2n-2})
\end{bmatrix} = 
\begin{bmatrix}
1 & x_0 &x_0^2&...&x_0^{2n-2} \\
1&x_1&x_1^2&...&x_1^{2n-2} \\
1&x_2&x_2^2&...&x_2^{2n-2} \\
... \\
1&x_{2n-2}&x_{2n-2}^2&...&x_{2n-2}^{2n-2}\
\end{bmatrix}
\begin{bmatrix}
b_0\\b_1\\b_2\\...\\b_{2n-2}
\end{bmatrix}$

得到点值 $[a(x_0),a(x_1),a(x_2),...,a(x_{2n-2})]$ 和 $[b(x_0),b(x_1),b(x_2),...,b(x_{2n-2})]$。

相乘得到 $c(x)$ 的点值 $[a(x_0)b(x_0),a(x_1)b(x_1),a(x_2)b(x_2),...,a(x_{2n-2})b(x_{2n-2})]$。

然后求解线性方程组计算 $c(x)$ 系数 $[c_0,c_1,c_2,...,c_{2n-2}]$

$\begin{matrix}
a(x_0)b(x_0) = c_0+c_1x_0+c_2x_0^2+...+c_{2n-2}x_0^{2n-2} \\
a(x_1)b(x_1) = c_0+c_1x_1+c_2x_1^2+...+c_{2n-2}x_1^{2n-2} \\
a(x_2)b(x_2) = c_0+c_1x_2+c_2x_2^2+...+c_{2n-2}x_2^{2n-2} \\
... \\
a(x_{2n-2})b(x_{2n-2}) = c_0+c_1x_{2n-2}+c_2x_{2n-2}^2+...+c_{2n-2}x_{2n-2}^{2n-2}\
\end{matrix}$

矩阵表示：

$\begin{bmatrix}
a(x_0)b(x_0)\\
a(x_1)b(x_1)  \\
a(x_2)b(x_2) \\
... \\
a(x_{2n-2})b(x_{2n-2})
\end{bmatrix} = 
\begin{bmatrix}
1 & x_0 &x_0^2&...&x_0^{2n-2} \\
1&x_1&x_1^2&...&x_1^{2n-2} \\
1&x_2&x_2^2&...&x_2^{2n-2} \\
... \\
1&x_{2n-2}&x_{2n-2}^2&...&x_{2n-2}^{2n-2}\
\end{bmatrix}
\begin{bmatrix}
c_0\\c_1\\c_2\\...\\c_{2n-2}
\end{bmatrix}$

$\begin{bmatrix}
c_0\\c_1\\c_2\\...\\c_{2n-2}
\end{bmatrix}= 
\begin{bmatrix}
1 & x_0 &x_0^2&...&x_0^{2n-2} \\
1&x_1&x_1^2&...&x_1^{2n-2} \\
1&x_2&x_2^2&...&x_2^{2n-2} \\
... \\
1&x_{2n-2}&x_{2n-2}^2&...&x_{2n-2}^{2n-2}\
\end{bmatrix}^{-1}
\begin{bmatrix}
a(x_0)b(x_0)\\
a(x_1)b(x_1)  \\
a(x_2)b(x_2) \\
... \\
a(x_{2n-2})b(x_{2n-2})
\end{bmatrix}$

&nbsp;

例子：

$a(x) = 1+2x+x^2 \\ b(x) = 1 -2x+ x^2$

此时它们的乘积的最高次数为 4，我们分别找 5 个点：$(-2,1),(-1,0),(0,1),(1,4),(2,9)$ 和 $(-2,9),(-1,4),(0,1),(1,0),(2,1)$。

直接相乘纵坐标得到 $(-2,9),(-1,0),(0,1),(1,0),(2,9)$。

通过这 5 个点确定乘积为 $1-2x^2+x^4$。

&nbsp;

对于系数相乘，复杂度是 $O(n^2)$；对于点值相乘，复杂度是 $O(n)$。

但是在点值相乘中，两个多项式求点值、乘积多项式求系数的复杂度仍是 $O(n^2)$。FFT 的作用就是将这两个过程的时间复杂度降到 $O(n\log n)$。

---

&nbsp;

下面来逐步推导如何得到最终的 FFT 算法。

首先注意到，对于多项式代入求值，如果它是奇函数或偶函数，当我们选择互为相反数的点时，求值的计算量减小了一半。

比如，对于偶函数 $x^2$，需要计算八个点，我们选择 $[-4,-3,-2,-1,1,2,3,4]$，只需要代入大于 0 的四个点进行求值即可。奇函数同理。

对于不具备奇偶性的多项式，我们可以把它分解为奇函数与偶函数之和（任何函数可以分解成奇函数和偶函数之和）。

&nbsp;

$P(x) = p_0 + p_1x+p_2x^2+...+p_{n-1}x^{n-1}$，需要计算 n 个点，选择点 $[\pm x_1,\pm x_2,...,\pm x_{n/2}]$。

$P(x)=P_e(x^2)+xP_o(x^2)$，奇函数是 $xP_o(x^2)$，偶函数是 $P_e(x^2)$。

$P_e$ 的系数是 $[p_0,p_2,p_4,...]$，$P_o$ 的系数是 $[p_1,p_3,p_5,...]$，需要代入计算的点是 $[x_1^2,x_2^2,...,x_{n/2}^2]$。

然后 $P_e$ 和 $P_o$ 当作新的多项式，递归地重复上面的步骤，最终需要代入计算的点可以缩减到一个，这个点选择为 1。

&nbsp;

这里有需要注意的地方：
1. 每一层递归需要计算的点会减半，因此最开始的点的数量应该是 2 的幂。
2. 只有点是相反数时，代入计算量才可以减半。为了让每一层迭代的点都是一对一对的相反数，最开始的 $[\pm x_1,\pm x_2,...,\pm x_{n/2}]$ 需要引入复数。

&nbsp;

比如多项式 $P(x)=x^3+x^2-x-1$，最高次数为 3，选择 4 个点。

迭代过程 $[x_1,-x_1,x_2,-x_2]$、$[x_1^2,x_2^2]$、$[x_1^4]$，最后一个点选为 1，即 $x_1^4=1$。可以解得最开始应该选择 $[1,-1,i,-i]$。

&nbsp;

比如多项式 $P(x)=x^5-x^3+x^2-x-1$，最高次数为 5，至少选择 6 个点，因此选择 8 个点。

迭代过程为 $[x_1,-x_1,x_2,-x_2,x_3,-x_3,x_4,-x_4]$、$[1,-1,i,-i]$、$[1,-1]$、$[1]$。

&nbsp;

$P(x) = p_0 + p_1x+p_2x^2+...+p_{d-1}x^{d-1}$，需要计算 n 个点，$n \ge (d+1),n=2^k,k\in\Z$。

这 n 个点的选择是固定的，即 $z^n=1$ 的复数根。

根据欧拉公式 $e^{i\theta}=\cos\theta + i\sin\theta$，取 $\theta=2k\pi$，$e^{i2k\pi}=1$。

复数 $z$ 写成极坐标形式：$z=r(\cos\theta+i\sin\theta)=re^{i\theta}$，$r$ 为模长，$\theta$ 为角度。

求解 $z^n=1$ 等价于求解 $r^ne^{in\theta}=e^{i2k\pi}$。

极坐标模长部分 $r^n=1$，得到 $r=1$；角度部分 $n\theta=2k\pi$，得到 $\theta=\frac{2k\pi}{n}$。

得到 $z^n=1$ 的解是 $z_k =\cos\frac{2k\pi}{n} + i\sin\frac{2k\pi}{n}=e^{\frac{2\pi ki}{n}}$。由于只需要 n 个解，取 $k=0,1,2,...,n-1$ 即可。

这 n 个点将复平面单位圆平分成 n 份。

&nbsp;

记 $\omega=e^{\frac{2\pi i}{n}}$，选择在 $[\omega^0,\omega^1,\omega^2,...,\omega^{n-1}]$ 这 n 个点上求值。

$P(\omega^j) = P_e(\omega^{2j})+\omega^jP_o(\omega^{2j}) \\ 
P(-\omega^j) = P_e(\omega^{2j})-\omega^jP_o(\omega^{2j}) \\
j\in \{0,1,2,...(n/2-1)\}$

由于 $-\omega^j = \omega^{j+n/2}$，最终化简为：

$P(\omega^j) = P_e(\omega^{2j})+\omega^jP_o(\omega^{2j}) \\ 
P(\omega^{j+n/2}) = P_e(\omega^{2j})-\omega^jP_o(\omega^{2j}) \\
j\in \{0,1,2,...(n/2-1)\}$

其中 $P_e$ 的系数为 $[p_0,p_2,...,p_{n-2}]$，$P_o$ 的系数为 $[p_1,p_3,...,p_{n-1}]$。

&nbsp;

求值过程用矩阵表示：

$\begin{bmatrix}
P(\omega^0)\\ P(\omega^1)\\ P(\omega^2) \\ ... \\ P(\omega^{n-1})\end{bmatrix}=\begin{bmatrix}1 & \omega^0 &\omega^0&...&\omega^0 \\ 1&\omega^1&\omega^2&...&\omega^{n-1} \\
1&\omega^2&\omega^4&...&\omega^{2(n-1)} \\... \\1&\omega^{n-1}&\omega^{2(n-1)}&...&\omega^{(n-1)(n-1)} \end{bmatrix}
\begin{bmatrix}
p_0\\p_1\\p_2\\...\\p_{n-1}
\end{bmatrix}$

FFT 就是选择 $[\omega^0,\omega^1,\omega^2,...,\omega^{n-1}]$ 这 n 个点，然后用分治的思想，递归处理代入求值。

```cpp
constexpr double PI = 3.141592653589;
using cd = std::complex<double>;

void fft(std::vector<cd>& p) {
    int n = p.size();   // n为2的幂
    if (n == 1) {
        return;
    }

    std::vector<cd> pe(n/2), po(n/2);
    for (int i = 0; 2 * i < n; i++) {
        // 根据奇偶性拆分
        pe[i] = p[2 * i];
        po[i] = p[2 * i + 1];
    }

    // 递归求值
    fft(pe);
    fft(po);

    const double angle = 2 * PI / n;
    const cd w(std::cos(angle), std::sin(angle));  // omega的一次方
    cd wk(1);
    for (int i = 0; 2 * i < n; i++) {
        p[i] = pe[i] + wk * po[i];
        p[i + n / 2] = pe[i] - wk * po[i];
        wk *= w;
    }
}
```

目前为止，讨论清楚了 FFT 如何选点、代入求值，接下来讨论如何根据值求系数。

$c(x) = a(x)b(x)$，选择 n 个点，n 为 2 的幂。

$\begin{bmatrix}a(\omega^0)b(\omega^0)\\ a(\omega^1)b(\omega^1)\\ a(\omega^2)b(\omega^2) \\... \\ a(\omega^{n-1})b(\omega^{n-1})\end{bmatrix}=
\begin{bmatrix}1 & \omega^0 &\omega^0&...&\omega^0 \\
1&\omega^1&\omega^2&...&\omega^{n-1} \\
1&\omega^2&\omega^4&...&\omega^{2(n-1)} \\
... \\1&\omega^{n-1}&\omega^{2(n-1)}&...&\omega^{(n-1)(n-1)}\end{bmatrix}
\begin{bmatrix}
c_0\\c_1\\c_2\\...\\c_{n-1}
\end{bmatrix}$

$\begin{bmatrix}c_0\\c_1\\c_2\\...\\c_{n-1}\end{bmatrix}= \begin{bmatrix}1 & \omega^0 &\omega^0&...&\omega^0 \\1&\omega^1&\omega^2&...&\omega^{n-1} \\1&\omega^2&\omega^4&...&\omega^{2(n-1)} \\... \\1&\omega^{n-1}&\omega^{2(n-1)}&...&\omega^{(n-1)(n-1)}
\end{bmatrix}^{-1}\begin{bmatrix}
a(\omega^0)b(\omega^0)\\ a(\omega^1)b(\omega^1)\\ a(\omega^2)b(\omega^2) \\ ... \\ a(\omega^{n-1})b(\omega^{n-1})
\end{bmatrix}=\frac{1}{n}
\begin{bmatrix}1 & \omega^0 &\omega^0&...&\omega^0 \\
1&\omega^{-1}&\omega^{-2}&...&\omega^{-(n-1)} \\
1&\omega^{-2}&\omega^{-4}&...&\omega^{-2(n-1)} \\
... \\ 1&\omega^{-(n-1)}&\omega^{-2(n-1)}&...&\omega^{-(n-1)(n-1)}
\end{bmatrix}
\begin{bmatrix}
a(\omega^0)b(\omega^0)\\ a(\omega^1)b(\omega^1) \\ a(\omega^2)b(\omega^2) \\... \\ a(\omega^{n-1})b(\omega^{n-1})
\end{bmatrix}$

通过矩阵可以看到，求系数的过程和求值的过程非常近似，只有参数发生改变。

```cpp
constexpr double PI = 3.141592653589;
using cd = std::complex<double>;

void ifft(std::vector<cd>& p) {
    int n = p.size();   // n为2的幂
    if (n == 1) {
        return;
    }

    std::vector<cd> pe(n/2), po(n/2);
    for (int i = 0; 2 * i < n; i++) {
        // 根据奇偶性拆分
        pe[i] = p[2 * i];
        po[i] = p[2 * i + 1];
    }

    // 递归
    ifft(pe);
    ifft(po);

    const double angle = -2 * PI / n;
    const cd w(std::cos(angle), std::sin(angle));
    cd wk(1);
    for (int i = 0; 2 * i < n; i++) {
        p[i] = pe[i] + wk * po[i];
        p[i + n / 2] = pe[i] - wk * po[i];
        // 每轮除以2，等效于整个除以n
        p[i] /= 2;
        p[i + n / 2] /= 2;
        wk *= w;
    }
}
```
