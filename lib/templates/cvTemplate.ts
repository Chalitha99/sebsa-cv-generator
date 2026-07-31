export const cvTemplateSource = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #2D3748; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 30px; background-color: #ffffff;">
  <!-- Header with Avatar -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 3px solid #1A365D; padding-bottom: 15px;">
    <tr>
      <td style="vertical-align: middle;">
        <h1 style="color: #1A365D; font-size: 32px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.5px;">{{name}}</h1>
        <h2 style="color: #4A5568; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">{{currentPosition}}</h2>
        {{#if customerName}}
        <div style="color: #718096; font-size: 12px; font-style: italic;">
          Customized for: <span style="font-weight: 600; color: #4A5568;">{{customerName}}</span>
        </div>
        {{/if}}
      </td>
      {{#if avatar}}
      <td style="width: 95px; text-align: right; vertical-align: middle;">
        <img src="{{avatar}}" alt="{{name}}" style="width: 80px; height: 80px; border-radius: 40px; border: 3px solid #1A365D; object-fit: cover;" />
      </td>
      {{/if}}
    </tr>
  </table>

  <!-- Summary -->
  {{#if summary}}
  <div style="margin-bottom: 25px;">
    <h3 style="color: #1A365D; font-size: 15px; font-weight: 700; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.8px;">Professional Summary</h3>
    <p style="font-size: 13.5px; margin: 0; color: #4A5568; text-align: justify;">{{summary}}</p>
  </div>
  {{/if}}

  <!-- Core Competencies -->
  {{#if skillsAligned}}
  <div style="margin-bottom: 25px;">
    <h3 style="color: #1A365D; font-size: 15px; font-weight: 700; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.8px;">Core Competencies</h3>
    <div style="font-size: 13px; color: #4A5568; line-height: 1.8;">
      {{#each skillsAligned}}
        <span style="display: inline-block; bg-color: #EDF2F7; background-color: #EDF2F7; color: #2B6CB0; padding: 2px 10px; margin: 2px 4px; border-radius: 4px; font-weight: 600;">{{this}}</span>
      {{/each}}
    </div>
  </div>
  {{/if}}

  <!-- Professional Experience -->
  {{#if experience}}
  <div style="margin-bottom: 25px;">
    <h3 style="color: #1A365D; font-size: 15px; font-weight: 700; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.8px;">Professional Experience</h3>
    {{#each experience}}
    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
        <tr>
          <td style="font-size: 14px; font-weight: 700; color: #2D3748;">
            {{position}} <span style="font-weight: 400; color: #718096;">| {{company}}</span>
          </td>
          <td style="text-align: right; font-size: 12.5px; font-weight: 600; color: #718096; font-style: italic;">
            {{period}}
          </td>
        </tr>
      </table>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #4A5568;">
        {{#each tasks}}
        <li style="margin-bottom: 4px; text-align: justify;">{{this}}</li>
        {{/each}}
      </ul>
    </div>
    {{/each}}
  </div>
  {{/if}}

  <!-- Special Projects -->
  {{#if specialProjects}}
  <div style="margin-bottom: 25px;">
    <h3 style="color: #1A365D; font-size: 15px; font-weight: 700; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.8px;">Special Projects</h3>
    {{#each specialProjects}}
    <div style="margin-bottom: 15px;">
      <strong style="font-size: 14px; color: #2D3748; display: block; margin-bottom: 4px;">{{title}}</strong>
      <p style="font-size: 13px; margin: 0; color: #4A5568; text-align: justify;">{{brief}}</p>
    </div>
    {{/each}}
  </div>
  {{/if}}

  <!-- Academic Background -->
  {{#if academic}}
  <div style="margin-bottom: 25px;">
    <h3 style="color: #1A365D; font-size: 15px; font-weight: 700; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.8px;">Academic Background</h3>
    {{#each academic}}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <td style="font-size: 13.5px; font-weight: 700; color: #2D3748;">
          {{qualification}} <span style="font-weight: 400; color: #718096;">— {{institution}}</span>
        </td>
        <td style="text-align: right; font-size: 12.5px; font-weight: 600; color: #718096; font-style: italic;">
          {{period}}
        </td>
      </tr>
    </table>
    {{/each}}
  </div>
  {{/if}}

  <!-- Certifications -->
  {{#if certifications}}
  <div style="margin-bottom: 25px;">
    <h3 style="color: #1A365D; font-size: 15px; font-weight: 700; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.8px;">Certifications</h3>
    {{#each certifications}}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <td style="font-size: 13.5px; font-weight: 700; color: #2D3748;">
          {{name}} <span style="font-weight: 400; color: #718096;">— {{issuer}}</span>
        </td>
        <td style="text-align: right; font-size: 12.5px; font-weight: 600; color: #718096; font-style: italic;">
          {{year}}
        </td>
      </tr>
    </table>
    {{/each}}
  </div>
  {{/if}}
</div>
`;
