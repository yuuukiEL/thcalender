from setuptools import setup, Extension
from Cython.Build import cythonize
import numpy as np

extensions = [
    Extension(
        "cython_optimized",
        ["cython_optimized.pyx"],
        include_dirs=[np.get_include()]
    ),
    Extension(
        "cython_models",
        ["cython_models.pyx"],
        include_dirs=[np.get_include()]
    )
]

setup(
    ext_modules=cythonize(extensions)
) 