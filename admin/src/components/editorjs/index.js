import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createReactEditorJS } from 'react-editor-js'
import requiredTools from './requiredTools';
import customTools from '../../config/customTools';

import MediaLibAdapter from '../medialib/adapter'
import MediaLibComponent from '../medialib/component';
import {changeFunc, getToggleFunc} from '../medialib/utils';
import { darkModeStyles } from './darkMode.styles'

const EditorJs = createReactEditorJS();

const Editor = ({ onChange, name, value }) => {
  const isUsingDarkMode = window.localStorage?.STRAPI_THEME === "dark";
  const [editorInstance, setEditorInstance] = useState();
  const [mediaLibBlockIndex, setMediaLibBlockIndex] = useState(-1);
  const [isMediaLibOpen, setIsMediaLibOpen] = useState(false);
  const stylesheetRef = useRef(null)

  const mediaLibToggleFunc = useCallback(getToggleFunc({
    openStateSetter: setIsMediaLibOpen,
    indexStateSetter: setMediaLibBlockIndex
  }), []);

  const handleMediaLibChange = useCallback((data) => {
    changeFunc({
        indexStateSetter: setMediaLibBlockIndex,
        data,
        index: mediaLibBlockIndex,
        editor: editorInstance
    });
    mediaLibToggleFunc();
  }, [mediaLibBlockIndex, editorInstance]);

  useEffect(() => {
    if (isUsingDarkMode) {
      const stylesheet = document.createElement("style");

      stylesheetRef.current = stylesheet;

      stylesheet.innerHTML = darkModeStyles;

      document.head.appendChild(stylesheet);
    }

    return () => {
      if (stylesheetRef.current) {
        stylesheetRef.current.parentNode.removeChild(stylesheetRef.current);
      }
    }
  }, [stylesheetRef, isUsingDarkMode]);

  const customImageTool = {
    mediaLib: {
      class: MediaLibAdapter,
      config: {
        mediaLibToggleFunc
      }
    }
  }

  return (
    <>
      <div style={{ border: `1px solid rgb(227, 233, 243)`, borderRadius: `2px`, marginTop: `4px` }}>
        <EditorJs
          onChange={(api, ev) => {
            api.saver.save().then(newData => {
              if (!newData.blocks.length) {
                onChange({ target: { name, value: null } });
              } else {
                onChange({ target: { name, value: JSON.stringify(newData) } });
              }
            });
          }}
          tools={{...requiredTools, ...customTools, ...customImageTool}}
          onInitialize={editor => {
            const api = editor.dangerouslyLowLevelInstance;
            api.isReady.then(() => {
              setEditorInstance(api);
              if(value && JSON.parse(value).blocks.length) {
                api.render(JSON.parse(value))
              }
            })
          }}
        />
      </div>
      <MediaLibComponent
        isOpen={isMediaLibOpen}
        onChange={handleMediaLibChange}
        onToggle={mediaLibToggleFunc}
      />
    </>
  );
};

Editor.propTypes = {
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
};

export default Editor;
