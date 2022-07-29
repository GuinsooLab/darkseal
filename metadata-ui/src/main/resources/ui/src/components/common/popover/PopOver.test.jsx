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

import {
  fireEvent,
  getByText,
  queryByText,
  render,
  screen,
} from '@testing-library/react';
import React from 'react';
import PopOver from './PopOver';

let global;

global.document.createRange = () => ({
  setStart: jest.fn(),
  setEnd: jest.fn(),
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document,
  },
});

describe('Test Popover Component', () => {
  it('Component should render', () => {
    const { container } = render(
      <PopOver
        arrow
        className=""
        delay={500}
        hideDelay={0}
        position="bottom"
        size="regular"
        sticky={false}
        theme="dark"
        trigger="click">
        <span>Hello World</span>
      </PopOver>
    );

    const popover = queryByText(container, /Hello World/i);

    expect(popover).toBeInTheDocument();
  });

  it('Onclick popover should display title', async () => {
    const { container } = render(
      <PopOver position="bottom" title="test popover" trigger="click">
        <span>Hello World</span>
      </PopOver>
    );

    fireEvent(
      getByText(container, /Hello World/i),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );

    expect(await screen.findByText(/test popover/i)).toBeInTheDocument();
  });

  it('Onclick popover should display html', async () => {
    const html = <span>test popover</span>;
    const { container } = render(
      <PopOver html={html} position="bottom" trigger="click">
        <span>Hello World</span>
      </PopOver>
    );

    fireEvent(
      getByText(container, /Hello World/i),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );

    expect(await screen.findByText(/test popover/i)).toBeInTheDocument();
  });
});
