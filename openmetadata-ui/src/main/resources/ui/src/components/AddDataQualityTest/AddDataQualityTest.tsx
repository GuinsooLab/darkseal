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

import React from 'react';
import { CreateColumnTest } from '../../generated/api/tests/createColumnTest';
import { CreateTableTest } from '../../generated/api/tests/createTableTest';
import { Table } from '../../generated/entity/data/table';
import { TableTest } from '../../generated/tests/tableTest';
import { TableTestDataType } from '../../interface/dataQuality.interface';
import ColumnTestForm from './Forms/ColumnTestForm';
import TableTestForm from './Forms/TableTestForm';

type Props = {
  data?: TableTestDataType;
  isTableDeleted?: boolean;
  testMode: 'table' | 'column';
  columnOptions: Table['columns'];
  tableTestCase: TableTest[];
  handleAddTableTestCase: (data: CreateTableTest) => void;
  handleAddColumnTestCase: (data: CreateColumnTest) => void;
  onFormCancel: () => void;
  selectedColumn: string;
};

const AddDataQualityTest = ({
  tableTestCase,
  data,
  testMode,
  columnOptions = [],
  selectedColumn,
  isTableDeleted,
  handleAddTableTestCase,
  handleAddColumnTestCase,
  onFormCancel,
}: Props) => {
  return (
    <div
      className="tw-max-w-xl tw-mx-auto tw-pb-6"
      data-testid="add-data-quality-test">
      {testMode === 'table' ? (
        <TableTestForm
          data={data as TableTest}
          handleAddTableTestCase={handleAddTableTestCase}
          isTableDeleted={isTableDeleted}
          tableTestCase={tableTestCase}
          onFormCancel={onFormCancel}
        />
      ) : (
        <ColumnTestForm
          column={columnOptions}
          data={data as CreateColumnTest}
          handleAddColumnTestCase={handleAddColumnTestCase}
          isTableDeleted={isTableDeleted}
          selectedColumn={selectedColumn}
          onFormCancel={onFormCancel}
        />
      )}
    </div>
  );
};

export default AddDataQualityTest;
