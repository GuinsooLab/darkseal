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

import { EntityTags, TagOption } from 'Models';
import { ReactNode } from 'react';
import { TagProps } from '../Tags/tags.interface';

export type TagsContainerProps = {
  children?: ReactNode;
  editable?: boolean;
  dropDownHorzPosRight?: boolean;
  selectedTags: Array<EntityTags>;
  tagList: Array<TagOption | string>;
  type?: TagProps['type'];
  showTags?: boolean;
  showAddTagButton?: boolean;
  className?: string;
  containerClass?: string;
  buttonContainerClass?: string;
  onSelectionChange?: (selectedTags: Array<EntityTags>) => void;
  onCancel?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};
