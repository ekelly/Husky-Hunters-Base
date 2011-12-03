from distutils.core import setup

setup(name='huskyhunter-base',
      version='1.0',
      packages=['huskyhunter', 'huskyhunter.base'],
      author='Roderic Morris',
      author_email='roderyc@gmail.com',
      url='https://github.com/nuacm/Husky-Hunters-Base/',
      package_dir={'': 'src'},
      scripts=['tasks/run'])
