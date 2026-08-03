/**
 * Live on-screen CV preview/edit template (Handlebars), compiled by CvPreviewTemplate.tsx and
 * rendered into #cv-preview-root. That same DOM node drives PDF export (lib/cvExport.ts,
 * html2canvas) — so every style here MUST be inline (no Tailwind/utility classes, no oklch()),
 * or html2canvas throws and PDF export silently fails (see docs/04-rbac-security.md history —
 * Tailwind v4's default palette is oklch(), which html2canvas 1.x cannot parse).
 *
 * Layout mirrors the SEBSA-branded reference template (two-column: Objective + Academic on the
 * left, Experience + Special Projects on the right, Skills + Certifications full-width below).
 * Field names are exactly TailoredCv's (app/(authenticated)/generate/types.ts) — no renaming —
 * since CvSectionEditor.tsx edits that same shape directly.
 */
export const cvTemplateSource = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #2D3748; line-height: 1.55; max-width: 800px; margin: 0 auto; padding: 32px; background-color: #ffffff;">
  <!-- Header: photo, name/title, brand logo -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
    <tr>
      <td style="width: 92px; vertical-align: top;">
        {{#if avatar}}
        <img src="{{avatar}}" alt="{{name}}" style="width: 80px; height: 80px; border-radius: 8px; border: 2px solid #8FD3E8; object-fit: cover; display: block;" />
        {{else}}
        <div style="width: 80px; height: 80px; border-radius: 8px; border: 2px solid #E2E8F0; background-color: #F7FAFC;"></div>
        {{/if}}
      </td>
      <td style="vertical-align: top; padding-left: 4px;">
        <h1 style="color: #1A202C; font-size: 26px; font-weight: 800; margin: 0 0 4px 0;">{{name}}</h1>
        <h2 style="color: #4B2E83; font-size: 14px; font-weight: 700; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.6px;">{{currentPosition}}</h2>
        {{#if academic.[0].qualification}}
        <p style="color: #718096; font-size: 12px; margin: 0;">{{academic.[0].qualification}}</p>
        {{/if}}
        {{#if customerName}}
        <p style="color: #A0AEC0; font-size: 11px; font-style: italic; margin: 6px 0 0 0;">
          Customized for: <span style="font-weight: 600; color: #718096;">{{customerName}}</span>
        </p>
        {{/if}}
      </td>
      <td style="width: 130px; text-align: right; vertical-align: top;">
        <img src="/images/seb-logo-1.png" alt="SEBSA" style="width: 110px; height: auto;" />
      </td>
    </tr>
  </table>
  <div style="height: 3px; background-color: #4B2E83; margin-bottom: 20px; border-radius: 2px;"></div>

  <!-- Two-column body -->
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <!-- Left column: Objective + Academic -->
      <td style="width: 34%; vertical-align: top; padding-right: 18px;">
        {{#if summary}}
        <div style="margin-bottom: 22px;">
          <div style="background-color: #4B2E83; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 6px 12px; border-radius: 4px; margin-bottom: 10px;">Objective</div>
          <p style="font-size: 12px; margin: 0; color: #4A5568; text-align: justify;">{{summary}}</p>
        </div>
        {{/if}}

        {{#if academic}}
        <div style="margin-bottom: 22px;">
          <div style="background-color: #4B2E83; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 6px 12px; border-radius: 4px; margin-bottom: 10px;">Academic</div>
          {{#each academic}}
          <div style="margin-bottom: 12px;">
            <p style="font-size: 12.5px; font-weight: 700; color: #2D3748; margin: 0;">{{qualification}}</p>
            <p style="font-size: 11.5px; color: #718096; margin: 2px 0 0 0;">{{institution}} ({{period}})</p>
          </div>
          {{/each}}
        </div>
        {{/if}}

        {{#if skillsAligned}}
        <div style="margin-bottom: 22px;">
          <div style="background-color: #4B2E83; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 6px 12px; border-radius: 4px; margin-bottom: 10px;">Skills</div>
          <div style="font-size: 11.5px; color: #4A5568; line-height: 2;">
            {{#each skillsAligned}}
              <span style="display: inline-block; background-color: #EEF2FF; color: #4B2E83; padding: 3px 9px; margin: 0 4px 4px 0; border-radius: 4px; font-weight: 600;">{{this}}</span>
            {{/each}}
          </div>
        </div>
        {{/if}}

        {{#if certifications}}
        <div style="margin-bottom: 22px;">
          <div style="background-color: #4B2E83; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 6px 12px; border-radius: 4px; margin-bottom: 10px;">Certifications</div>
          {{#each certifications}}
          <div style="margin-bottom: 10px;">
            <p style="font-size: 12px; font-weight: 700; color: #2D3748; margin: 0;">{{name}}</p>
            <p style="font-size: 11px; color: #718096; margin: 2px 0 0 0;">{{issuer}}{{#if year}} — {{year}}{{/if}}</p>
          </div>
          {{/each}}
        </div>
        {{/if}}
      </td>

      <!-- Right column: Experience + Special Projects -->
      <td style="width: 66%; vertical-align: top; padding-left: 18px; border-left: 1px solid #E2E8F0;">
        {{#if experience}}
        <div style="margin-bottom: 22px;">
          <div style="background-color: #4B2E83; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px;">Experience</div>
          {{#each experience}}
          <div style="margin-bottom: 16px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
              <tr>
                <td style="font-size: 13px; font-weight: 700; color: #2D3748;">
                  {{position}} <span style="font-weight: 400; color: #718096;">— {{company}}</span>
                </td>
                <td style="text-align: right; font-size: 11px; font-weight: 600; color: #A0AEC0; font-style: italic; white-space: nowrap;">
                  ({{period}})
                </td>
              </tr>
            </table>
            <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #4A5568;">
              {{#each tasks}}
              <li style="margin-bottom: 3px; text-align: justify;">{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/each}}
        </div>
        {{/if}}

        {{#if specialProjects}}
        <div style="margin-bottom: 22px;">
          <div style="background-color: #4B2E83; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px;">Special Projects</div>
          {{#each specialProjects}}
          <div style="margin-bottom: 14px;">
            <p style="font-size: 13px; font-weight: 700; color: #2D3748; margin: 0 0 3px 0;">{{title}}</p>
            <p style="font-size: 12px; margin: 0; color: #4A5568; text-align: justify;">{{brief}}</p>
          </div>
          {{/each}}
        </div>
        {{/if}}
      </td>
    </tr>
  </table>
</div>
`;
