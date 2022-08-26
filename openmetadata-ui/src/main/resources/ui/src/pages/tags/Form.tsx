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

import { FormErrorData } from 'Models';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import RichTextEditor from '../../components/common/rich-text-editor/RichTextEditor';
import { CreateTagCategory } from '../../generated/api/tags/createTagCategory';
import { errorMsg } from '../../utils/CommonUtils';

type CustomTagCategory = {
  categoryType: string;
  description: CreateTagCategory['description'];
  name: CreateTagCategory['name'];
};

type FormProp = {
  saveData: (value: CreateTagCategory) => void;
  initialData: CustomTagCategory;
  errorData?: FormErrorData;
};
type EditorContentRef = {
  getEditorContent: () => string;
};
const Form: React.FC<FormProp> = forwardRef(
  ({ saveData, initialData, errorData }: FormProp, ref): JSX.Element => {
    const [data, setData] = useState<CustomTagCategory>({
      name: initialData.name,
      description: initialData.description,
      categoryType: initialData.categoryType,
    });

    const isMounting = useRef<boolean>(true);
    const markdownRef = useRef<EditorContentRef>();

    const onChangeHadler = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      e.persist();
      setData((prevState) => {
        return {
          ...prevState,
          [e.target.name]: e.target.value,
        };
      });
    };

    useImperativeHandle(ref, () => ({
      fetchMarkDownData() {
        return markdownRef.current?.getEditorContent();
      },
    }));

    useEffect(() => {
      if (!isMounting.current) {
        saveData({
          ...(data as CreateTagCategory),
        });
      }
    }, [data]);

    // alwyas Keep this useEffect at the end...
    useEffect(() => {
      isMounting.current = false;
    }, []);

    return (
      <div className="tw-w-full tw-flex ">
        <div className="tw-flex tw-w-full">
          <div className="tw-w-full">
            {initialData.categoryType && (
              <div className="tw-mb-4">
                <label className="tw-form-label required-field">
                  Select Category Type
                </label>
                <select
                  required
                  className="tw-text-sm tw-appearance-none tw-border tw-border-main
                tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-grey-body  tw-leading-tight
                focus:tw-outline-none focus:tw-border-focus hover:tw-border-hover tw-h-10 tw-bg-white"
                  data-testid="category-type"
                  name="categoryType"
                  value={data.categoryType}
                  onChange={onChangeHadler}>
                  <option value="Descriptive">Descriptive </option>
                  <option value="Classification">Classification</option>
                </select>
              </div>
            )}
            <div className="tw-mb-4">
              <label className="tw-form-label required-field">Name</label>
              <input
                autoComplete="off"
                className="tw-text-sm tw-appearance-none tw-border tw-border-main
                tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-grey-body  tw-leading-tight
                focus:tw-outline-none focus:tw-border-focus hover:tw-border-hover tw-h-10"
                data-testid="name"
                name="name"
                placeholder="Name"
                type="text"
                value={data.name}
                onChange={onChangeHadler}
              />
              {errorData?.name && errorMsg(errorData.name)}
            </div>
            <div>
              <label className="tw-form-label">Description</label>
              <RichTextEditor
                initialValue={data.description}
                ref={markdownRef}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Form;
