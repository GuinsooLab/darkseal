/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import classNames from 'classnames';
import React from 'react';

interface ToggleSwitchV1Props {
  checked: boolean;
  handleCheck: () => void;
  testId?: string;
}

const ToggleSwitchV1 = ({
  checked,
  handleCheck,
  testId,
}: ToggleSwitchV1Props) => {
  const id = testId ? `toggle-button-${testId}` : 'toggle-button';

  return (
    <div
      className={classNames('toggle-switch', checked ? 'open' : null)}
      data-testid={id}
      onClick={handleCheck}>
      <div className="switch" />
    </div>
  );
};

export default ToggleSwitchV1;
