import prettier from 'prettier';
import { patchNode } from './parse-helpers';
import {
  splitSTORYOF,
  findAddsMap,
  findDependencies,
  findExportsMap as generateExportsMap,
} from './traverse-helpers';

function isUglyComment(comment, uglyCommentsRegex) {
  return uglyCommentsRegex.some(regex => regex.test(comment));
}

function generateSourceWithoutUglyComments(source, { comments, uglyCommentsRegex }) {
  let lastIndex = 0;
  const parts = [source];

  comments
    .filter(comment => isUglyComment(comment.value.trim(), uglyCommentsRegex))
    .map(patchNode)
    .forEach(comment => {
      parts.pop();

      const start = source.slice(lastIndex, comment.start);
      const end = source.slice(comment.end);

      parts.push(start, end);
      lastIndex = comment.end;
    });

  return parts.join('');
}

function prettifyCode(source, { prettierConfig, parser, filepath }) {
  let config = prettierConfig;
  let foundParser = null;
  if (parser === 'javascript' || /jsx?/.test(parser)) foundParser = 'babel';
  if (parser === 'typescript' || /tsx?/.test(parser)) foundParser = 'typescript';
  if (!config.parser) {
    if (foundParser) {
      config = {
        ...prettierConfig,
        parser: foundParser,
      };
    } else if (filepath) {
      config = {
        ...prettierConfig,
        filepath,
      };
    } else {
      config = {
        ...prettierConfig,
        parser: 'babel',
      };
    }
  }

  try {
    return prettier.format(source, config);
  } catch (e) {
    // Can fail when the source is a JSON
    return source;
  }
}

export function generateSourceWithDecorators(source, ast, decorator) {
  const { comments = [] } = ast;

  const parts = splitSTORYOF(ast, source);

  const newSource = parts.join(decorator);

  return {
    changed: parts.length > 1,
    source: newSource,
    comments,
  };
}

export function generateSourceWithoutDecorators(source, ast) {
  const { comments = [] } = ast;

  return {
    changed: true,
    source,
    comments,
  };
}

export function generateAddsMap(ast, storiesOfIdentifiers) {
  return findAddsMap(ast, storiesOfIdentifiers);
}

export function generateStoriesLocationsMap(ast, storiesOfIdentifiers) {
  const usingAddsMap = generateAddsMap(ast, storiesOfIdentifiers);
  const { addsMap, idsToFrameworks } = usingAddsMap;

  if (Object.keys(addsMap).length > 0) {
    return usingAddsMap;
  }
  const usingExportsMap = generateExportsMap(ast);

  return usingExportsMap || usingAddsMap;
}

export function generateDependencies(ast) {
  return findDependencies(ast);
}

export function generateStorySource({ source, ...options }) {
  let storySource = source;

  storySource = generateSourceWithoutUglyComments(storySource, options);
  storySource = prettifyCode(storySource, options);

  return storySource;
}
