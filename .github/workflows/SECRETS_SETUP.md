# GitHub Secrets Setup for Content Generation

This guide explains how to set up GitHub secrets for the automated content generation workflow.

## Required Secrets

The workflow needs authentication for OpenAI Codex. Set up **ONE** of the following:

### Option 1: CODEX_AUTH_JSON (Recommended)

Use your existing Codex authentication file with ChatGPT OAuth tokens.

**Steps:**

1. **Get your local auth.json content:**
   ```bash
   cat ~/.codex/auth.json
   ```

2. **Copy the entire JSON output** (including the `{` and `}`)

3. **Add to GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CODEX_AUTH_JSON`
   - Value: Paste the entire JSON content from step 2
   - Click "Add secret"

**Important Notes:**
- The OAuth tokens in auth.json expire periodically
- You'll need to update this secret when tokens expire
- To refresh: Delete old secret and create new one with updated auth.json

### Option 2: OPENAI_API_KEY (Alternative)

Use an OpenAI API key for authentication.

**Steps:**

1. **Get your OpenAI API key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new secret key
   - Copy the key (starts with `sk-...`)

2. **Add to GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `OPENAI_API_KEY`
   - Value: Paste your API key
   - Click "Add secret"

**Important Notes:**
- API keys don't expire (unless you revoke them)
- This uses usage-based billing
- Keep your API key secure and never commit it to the repository

## Optional: Custom Model Secret

If you want to use a different default model without specifying it each time:

1. **Add MODEL secret:**
   - Go to repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DEFAULT_MODEL`
   - Value: e.g., `gpt-4`, `gpt-5.1`, `gemini-3-pro-preview`
   - Click "Add secret"

2. **Update workflow** (if needed):
   - The workflow currently defaults to `gpt-5.1`
   - You can modify the default in `.github/workflows/generate-content.yml`

## How the Workflow Uses Secrets

The workflow tries authentication in this order:

1. **First**: Tries `CODEX_AUTH_JSON` if available
2. **Fallback**: Uses `OPENAI_API_KEY` if CODEX_AUTH_JSON is not set
3. **Error**: Fails if neither secret is available

## Security Best Practices

- ✅ **Never commit** auth.json or API keys to the repository
- ✅ **Rotate secrets** periodically (especially API keys)
- ✅ **Use secret scanning** (enabled by default on GitHub)
- ✅ **Limit access** to repository secrets to necessary team members
- ✅ **Monitor usage** of API keys on OpenAI dashboard

## Using the Workflow

Once secrets are set up:

1. Go to your repository → Actions tab
2. Click "Generate Content" workflow
3. Click "Run workflow" dropdown
4. Fill in:
   - **Section name**: e.g., "installing comapeo", "initial use"
   - **Model** (optional): defaults to gpt-5.1
   - **Engine** (optional): "default" or "gemini"
5. Click "Run workflow"

The workflow will:
- Set up Codex authentication using your secret
- Run content generation with fuzzy section matching
- Commit the generated content automatically
- Push to main branch

## Troubleshooting

### "Error: Neither CODEX_AUTH_JSON nor OPENAI_API_KEY secret is set"
- Add at least one of the required secrets (see above)

### "Authentication failed" or "Invalid credentials"
- **For CODEX_AUTH_JSON**: Your tokens may have expired
  - Re-run `codex login` locally
  - Copy updated auth.json to GitHub secret
- **For OPENAI_API_KEY**: Check that your key is valid
  - Verify on https://platform.openai.com/api-keys
  - Ensure key has proper permissions

### "No content changes were generated"
- Section name might not match any existing section
- Content might already be up-to-date
- Check workflow logs for Codex output

### Workflow fails during generation
- Check that dependencies installed correctly
- Verify Codex CLI is available
- Review full workflow logs for error messages

## Refreshing CODEX_AUTH_JSON

When your OAuth tokens expire:

1. **Re-authenticate locally:**
   ```bash
   codex login
   ```

2. **Get updated auth.json:**
   ```bash
   cat ~/.codex/auth.json
   ```

3. **Update GitHub secret:**
   - Go to Settings → Secrets and variables → Actions
   - Click on `CODEX_AUTH_JSON`
   - Click "Update secret"
   - Paste new auth.json content
   - Click "Update secret"

## Support

For issues with:
- **GitHub Actions**: Check workflow logs in Actions tab
- **Codex CLI**: See https://developers.openai.com/codex/cli/
- **OpenAI API**: See https://platform.openai.com/docs/

---

Last updated: 2025-12-01
