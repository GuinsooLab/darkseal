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

import { HTMLAttributes, ReactNode } from 'react';

export type editorRef = ReactNode | HTMLElement | string;
export type TextVariant = 'white' | 'black';

export enum Format {
  JSON = 'json',
  MARKDOWN = 'markdown',
}
export type EditorProp = {
  format: 'json' | 'markdown';
  initvalue?: string;
  suggestionList?: { text: string; value: string; url: string }[];
  mentionTrigger?: string;
  readonly?: boolean;
  customOptions?: ReactNode[];
};

export interface PreviewerProp {
  markdown: string;
  maxLength?: number;
  className?: string;
  enableSeeMoreVariant?: boolean;
  textVariant?: TextVariant;
}

export type PreviewStyle = 'tab' | 'vertical';

export type EditorType = 'markdown' | 'wysiwyg';

export interface RichTextEditorProp extends HTMLAttributes<HTMLDivElement> {
  autofocus?: boolean;
  initialValue: string;
  placeHolder?: string;
  previewStyle?: PreviewStyle;
  editorType?: EditorType;
  previewHighlight?: boolean;
  extendedAutolinks?: boolean;
  hideModeSwitch?: boolean;
  useCommandShortcut?: boolean;
  readonly?: boolean;
  height?: string;
  onTextChange?: (value: string) => void;
}

export interface EditorContentRef {
  getEditorContent: () => string;
  clearEditorContent: () => void;
}
