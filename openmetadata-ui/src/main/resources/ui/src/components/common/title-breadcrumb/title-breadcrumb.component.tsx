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

import { RightOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import TitleBreadcrumbSkeleton from '../../Skeleton/BreadCrumb/TitleBreadcrumbSkeleton.component';
import { TitleBreadcrumbProps } from './title-breadcrumb.interface';

const TitleBreadcrumb: FunctionComponent<TitleBreadcrumbProps> = ({
  titleLinks,
  className = '',
  noLink = false,
  widthDeductions,
}: TitleBreadcrumbProps) => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const finalWidthOfBreadcrumb = useMemo(() => {
    return (
      screenWidth -
      (widthDeductions ? widthDeductions : 0) - // Any extra deductions due to sibling elements of breadcrumb
      (titleLinks.length - 1) * 25 - // Deduction for every arrow between each titleLink name
      80 // Deduction due to margin of the container on both sides
    );
  }, [screenWidth, titleLinks, widthDeductions]);

  const maxWidth = useMemo(() => {
    return finalWidthOfBreadcrumb / titleLinks.length;
  }, [finalWidthOfBreadcrumb, titleLinks.length]);

  const changeWidth = useCallback(() => {
    setScreenWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', changeWidth);

    return () => {
      window.removeEventListener('resize', changeWidth);
    };
  }, []);

  return (
    <TitleBreadcrumbSkeleton titleLinks={titleLinks}>
      <nav className={className} data-testid="breadcrumb">
        <ol className="list-reset tw-rounded tw-flex">
          {titleLinks.map((link, index) => {
            const classes =
              'link-title tw-truncate' +
              (link.activeTitle ? ' tw-font-medium' : '');

            return (
              <li
                className="tw-flex tw-items-center"
                data-testid="breadcrumb-link"
                key={index}>
                {link.imgSrc ? (
                  <img
                    alt=""
                    className="tw-inline tw-h-5 tw-mr-2"
                    src={link.imgSrc}
                  />
                ) : null}
                {index < titleLinks.length - 1 && !noLink ? (
                  <>
                    <Link
                      className={classes}
                      style={{
                        maxWidth,
                        fontSize: '16px',
                      }}
                      to={link.url}>
                      {link.name}
                    </Link>
                    <span className="tw-px-2">
                      <RightOutlined className="tw-text-xs tw-cursor-default tw-text-gray-400 tw-align-middle" />
                    </span>
                  </>
                ) : link.url ? (
                  <Link
                    className={classes}
                    style={{
                      maxWidth,
                    }}
                    to={link.url}>
                    {link.name}
                  </Link>
                ) : (
                  <>
                    <Tooltip align={{ offset: [0, 10] }} title={link.name}>
                      <span
                        className={classNames(
                          classes,
                          'tw-cursor-text hover:tw-text-primary hover:tw-no-underline'
                        )}
                        data-testid="inactive-link"
                        style={{
                          maxWidth,
                        }}>
                        {link.name}
                      </span>
                    </Tooltip>
                    {noLink && index < titleLinks.length - 1 && (
                      <span className="tw-px-2">
                        <RightOutlined className="tw-text-xs tw-cursor-default tw-text-gray-400 tw-align-middle" />
                      </span>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </TitleBreadcrumbSkeleton>
  );
};

export default TitleBreadcrumb;
