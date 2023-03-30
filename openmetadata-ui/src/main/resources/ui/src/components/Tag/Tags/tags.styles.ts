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

export const tagStyles = {
  base: `tw-relative tw-inline-flex tw-text-xs tw-font-medium 
      tw-rounded tw-whitespace-nowrap`,
  contained: 'tw-bg-badge tw-mr-2 tw-my-0.5',
  outlined: 'tw-bg-transparent tw-mr-2 tw-my-0.5',
  label: 'tw-bg-transparent tw-border-none tw-text-grey-body',
  border: 'tw-bg-white tw-border tw-items-center tw-mr-1 tw-mt-1',

  text: {
    base: 'tw-no-underline hover:tw-no-underline',
    default: 'tw-px-2',
    editable: 'tw-pl-2 tw-pr-1',
    contained: 'tw-py-0.5 tw-px-2',
    outlined: 'tw-py-0.5 tw-px-2',
    border: 'tw-py-0.5 tw-px-2',
    label: 'tw-px-1',
  },
};
