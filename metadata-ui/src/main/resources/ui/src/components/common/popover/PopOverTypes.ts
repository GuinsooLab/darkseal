/*
 *  Copyright 2021 Collate
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

import React, { ReactNode } from 'react';
import { TooltipProps } from 'react-tippy';

export type Position = 'top' | 'left' | 'bottom' | 'right';
export type Trigger = 'mouseenter' | 'focus' | 'click' | 'manual';
export type Theme = 'dark' | 'light' | 'transparent';
export type Size = 'small' | 'regular' | 'big';

export interface PopOverProp extends TooltipProps {
  html?: React.ReactElement;
  title?: string;
  arrow?: boolean;
  theme?: Theme;
  size?: Size;
  position: Position;
  trigger: Trigger;
  children: ReactNode;
  className?: string;
  delay?: number;
  hideDelay?: number;
  sticky?: boolean;
}
