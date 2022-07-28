# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0
import os

from setuptools import find_packages, setup

__version__ = '0.23.0'


requirements_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'requirements-dev.txt')
with open(requirements_path) as requirements_file:
    requirements_dev = requirements_file.readlines()


setup(
    name='darkseal-common',
    version=__version__,
    description='Common code library for Darkseal',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    url='https://github.com/GuinsooLab/darkseal',
    maintainer='ciusji',
    maintainer_email='bqjimaster@gmail.com',
    packages=find_packages(exclude=['tests*']),
    install_requires=[
        # Packages in here should rarely be pinned. This is because these
        # packages (at the specified version) are required for project
        # consuming this library. By pinning to a specific version you are the
        # number of projects that can consume this or forcing them to
        # upgrade/downgrade any dependencies pinned here in their project.
        #
        # Generally packages listed here are pinned to a major version range.
        #
        # e.g.
        # Python FooBar package for foobaring
        # pyfoobar>=1.0, <2.0
        #
        # This will allow for any consuming projects to use this library as
        # long as they have a version of pyfoobar equal to or greater than 1.x
        # and less than 2.x installed.
        'Flask>=1.0.2',
        'attrs>=19.0.0',
        'marshmallow>=3.0',
        'marshmallow3-annotations>=1.0.0'
    ],
    extras_require={
        'all': requirements_dev
    },
    python_requires=">=3.6",
    package_data={'darkseal_common': ['py.typed']},
)
