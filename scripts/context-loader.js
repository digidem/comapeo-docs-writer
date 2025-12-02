#!/usr/bin/env node
/**
 * Context Loader Utility
 *
 * Shared module for loading and validating context configuration.
 * Used by gen.js and show-prompt.js to get context file definitions.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, 'context-config.json');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'context-config.schema.json');

/**
 * Load and validate context configuration
 * @param {string} contextSet - Optional context set key (defaults to config.defaultContextSet)
 * @returns {Object} Configuration object with context set files
 * @throws {Error} If config file not found, invalid, or context set not found
 */
function loadContextConfig(contextSet = null) {
  // Check if config file exists
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Context configuration file not found: ${CONFIG_PATH}`);
  }

  // Load config
  let config;
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    config = JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Failed to parse context configuration: ${error.message}`);
  }

  // Basic validation
  if (!config.version || !config.defaultContextSet || !config.contextSets) {
    throw new Error('Invalid context configuration: missing required fields');
  }

  // Determine which context set to use
  const targetContextSet = contextSet || config.defaultContextSet;

  if (!config.contextSets[targetContextSet]) {
    const availableSets = Object.keys(config.contextSets).join(', ');
    throw new Error(
      `Context set "${targetContextSet}" not found. Available sets: ${availableSets}`
    );
  }

  const contextSetConfig = config.contextSets[targetContextSet];

  // Validate context set structure
  if (!contextSetConfig.name || !contextSetConfig.files) {
    throw new Error(`Invalid context set "${targetContextSet}": missing name or files`);
  }

  // Check for duplicate IDs within the context set
  const idCounts = {};
  for (const file of contextSetConfig.files) {
    if (file.id) {
      idCounts[file.id] = (idCounts[file.id] || 0) + 1;
    }
  }

  const duplicateIds = Object.entries(idCounts)
    .filter(([id, count]) => count > 1)
    .map(([id]) => id);

  if (duplicateIds.length > 0) {
    throw new Error(
      `Context set "${targetContextSet}" has duplicate file IDs: ${duplicateIds.join(', ')}. ` +
      `Each file must have a unique ID within a context set.`
    );
  }

  // Sort files by injectOrder if specified, otherwise maintain order
  const sortedFiles = [...contextSetConfig.files].sort((a, b) => {
    const orderA = a.injectOrder || 999;
    const orderB = b.injectOrder || 999;
    return orderA - orderB;
  });

  // Resolve relative paths to absolute paths
  const resolvedFiles = sortedFiles.map(file => ({
    ...file,
    absolutePath: path.join(ROOT, file.path)
  }));

  return {
    config,
    contextSet: targetContextSet,
    contextSetConfig: {
      ...contextSetConfig,
      files: resolvedFiles
    },
    metadata: config.metadata || {}
  };
}

/**
 * Get statistics about context files
 * @param {Array} files - Array of context file objects
 * @returns {Object} Statistics object
 */
function getContextStats(files) {
  let totalSize = 0;
  let totalLines = 0;
  let filesFound = 0;
  let filesMissing = 0;
  const missingFiles = [];

  for (const file of files) {
    if (fs.existsSync(file.absolutePath)) {
      const content = fs.readFileSync(file.absolutePath, 'utf8');
      const size = Buffer.byteLength(content, 'utf8');
      totalSize += size;
      totalLines += content.split('\n').length;
      filesFound++;
    } else {
      filesMissing++;
      missingFiles.push({
        name: file.name,
        path: file.path,
        required: file.required
      });
    }
  }

  // Rough token estimate: ~4 characters per token
  const totalTokens = Math.ceil(totalSize / 4);

  return {
    totalFiles: files.length,
    filesFound,
    filesMissing,
    missingFiles,
    totalSize,
    totalLines,
    totalTokens,
    sizeFormatted: formatBytes(totalSize)
  };
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Load context files content for injection
 * @param {Array} files - Array of context file objects
 * @returns {string} Combined content with file markers
 */
function loadContextContent(files) {
  let fullContent = '';

  for (const file of files) {
    if (fs.existsSync(file.absolutePath)) {
      fullContent += `\n\n--- CONTEXT_FILE_START: ${file.name} ---\n`;
      fullContent += fs.readFileSync(file.absolutePath, 'utf8');
      fullContent += `\n--- CONTEXT_FILE_END: ${file.name} ---\n\n`;
    } else if (file.required) {
      throw new Error(`Required context file not found: ${file.path}`);
    }
    // Optional files that don't exist are silently skipped
  }

  return fullContent;
}

/**
 * Validate that all required context files exist
 * @param {Array} files - Array of context file objects
 * @returns {Object} Validation result
 */
function validateContextFiles(files) {
  const missingRequired = [];
  const missingOptional = [];

  for (const file of files) {
    if (!fs.existsSync(file.absolutePath)) {
      if (file.required) {
        missingRequired.push({
          id: file.id,
          name: file.name,
          path: file.path
        });
      } else {
        missingOptional.push({
          id: file.id,
          name: file.name,
          path: file.path
        });
      }
    }
  }

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    totalFiles: files.length,
    filesFound: files.length - missingRequired.length - missingOptional.length
  };
}

/**
 * List available context sets
 * @returns {Array} Array of context set info objects
 */
function listContextSets() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return [];
  }

  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configContent);

    return Object.entries(config.contextSets || {}).map(([key, set]) => ({
      key,
      name: set.name,
      description: set.description || '',
      fileCount: set.files?.length || 0,
      isDefault: key === config.defaultContextSet
    }));
  } catch (error) {
    return [];
  }
}

module.exports = {
  loadContextConfig,
  getContextStats,
  loadContextContent,
  validateContextFiles,
  listContextSets,
  formatBytes,
  CONFIG_PATH,
  SCHEMA_PATH
};