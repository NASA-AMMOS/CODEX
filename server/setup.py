from setuptools import setup
import setuptools.command.build_py
import subprocess

class BuildPyCommand(setuptools.command.build_py.build_py):

  def run(self):
    command = "npm install"
    subprocess.call(command, shell=True)
    setuptools.command.build_py.build_py.run(self)


setup(name='CODEX',
      version='1.0',
      description='Complex Data Explorer',
      url='https://github-fn.jpl.nasa.gov/CODEX/CODEX',
      author='Lukas Mandrake, Jack Lightholder, Tariq Soliman, Allan Eivazian',
      author_email='',
      license='JPL - not for external release',
      install_requires=[
          'pysptools','scikit-image','scipy','fastdtw',
          'pyyaml','markdown','sklearn','tornado','numpy',
          'scikit-learn','cython','npm'
      ],
      zip_safe=True,
      cmdclass={
        'npm': BuildPyCommand,
    })
