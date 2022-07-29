import { findByTestId, findByText, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ColumnTestForm from './ColumnTestForm';

const mockFunction = jest.fn();

jest.mock('../../common/rich-text-editor/RichTextEditor', () => {
  return jest.fn().mockReturnValue(<div>MarkdownWithPreview component</div>);
});

describe('Test ColumnTestForm component', () => {
  it('ColumnTestForm component should be render properly', async () => {
    const { container } = render(
      <ColumnTestForm
        column={[]}
        handleAddColumnTestCase={mockFunction}
        selectedColumn=""
        onFormCancel={mockFunction}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const columnName = await findByTestId(container, 'columnName');
    const columTestType = await findByTestId(container, 'columTestType');
    const cancelButton = await findByTestId(container, 'cancel-test');
    const saveButton = await findByTestId(container, 'save-test');
    const description = await findByText(
      container,
      /MarkdownWithPreview component/i
    );

    expect(columnName).toBeInTheDocument();
    expect(columTestType).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
  });
});
