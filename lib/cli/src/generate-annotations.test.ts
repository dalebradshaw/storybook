import * as fsExtra from 'fs-extra';
import * as generateAnnotations from './generate-annotations';

jest.mock('fs-extra');

jest.mock('@storybook/core-common', () => ({
  getAllPresets: jest.fn(() => ['bla', 'ble']),
}));

const mockedFsExtra = fsExtra as jest.Mocked<typeof fsExtra>;

describe('generateAnnotations', () => {
  describe('getAnnotationsFileContent', () => {
    test('should generate correct content for annotations', () => {
      const content = generateAnnotations.getAnnotationsFileContent([
        '../../node_modules/@storybook/addon-docs/dist/esm/register.js',
        '../../node_modules/some-storybook-addon/build/addDecorators.js',
        'preview.js',
      ]);
      expect(content).toMatchInlineSnapshot(`
        "import addonConfig from \\"@storybook/addon-docs/dist/esm/register.js\\";
        import addonConfig2 from \\"some-storybook-addon/build/addDecorators.js\\";
        import projectAnnotations from \\"./preview.js\\";

        export default [addonConfig, addonConfig2, projectAnnotations];"
      `);
    });
  });
});
