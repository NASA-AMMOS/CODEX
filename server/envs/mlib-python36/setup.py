from setuptools import find_packages, setup

with open ('requirements.txt') as f:
    requirements = f.read().splitlines()

if __name__ == '__main__':
    setup(
        name='mlib',
        version='1.0.0',
        packages=find_packages(),
        include_package_data=True,
        package_data={},
        install_requires=requirements
    )
