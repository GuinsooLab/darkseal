# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0

import os

from darkseal_medata import create_app

'''
  Entry point to flask.
'''

application = create_app(
    config_module_class=os.getenv('METADATA_SVC_CONFIG_MODULE_CLASS')
    or 'darkseal_medata.config.LocalConfig')

if __name__ == '__main__':
    application.run(host='0.0.0.0', port=5002)
