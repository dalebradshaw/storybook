import path from 'path';
import dedent from 'ts-dedent';
import { writeFile, existsSync } from 'fs-extra';
import { getAllPresets } from '@storybook/core-common';
import { logger } from '@storybook/node-logger';

export const getAnnotationsFileContent = (presets: string[]) => {
  const presetNames: string[] = [];
  const presetImports: string[] = [];

  const previewFile = presets.pop();
  // we add ./ to relative paths because they are not provided by default
  const previewPath = previewFile === 'preview' ? `./${previewFile}` : previewFile;

  presets.forEach((preset) => {
    const presetName = 'addonConfig';
    const duplicatesCount = presetNames.filter((p) => p === presetName).length;
    const finalName = `${presetName}${duplicatesCount ? duplicatesCount + 1 : ''}`;

    const presetPath = preset.replace(/.*node_modules\//, '');

    presetNames.push(finalName);
    presetImports.push(`import ${finalName} from "${presetPath}";\n`);
  });

  presetNames.push('projectAnnotations');
  presetImports.push(`import projectAnnotations from "./${previewPath}";\n`);

  return dedent`
    ${presetImports.join('')}
    export default [${presetNames.join(', ')}];
  `;
};

export async function writeAnnotationsFile(configDir = '.storybook') {
  try {
    logger.info(`=> Generating preset annotations file`);
    const presets = await getAllPresets(configDir);
    const annotationsFileContent = getAnnotationsFileContent(presets);
    const targetPath = path.join(configDir, 'annotations.js');

    if (existsSync(targetPath)) {
      logger.warn('=> File already exists! Please delete it and rerun this command.');
      process.exit(1);
    }

    await writeFile(targetPath, annotationsFileContent);
    logger.info(`=> Wrote file to ${targetPath}`);
  } catch (error) {
    throw new Error(`Failed to generate presets file :( ${error.message}`);
  }
}
