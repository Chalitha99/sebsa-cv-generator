export const cvTemplateSource = `
<div style="font-family: Calibri, sans-serif; color: #333333; line-height: 1.5; padding: 20px;">
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #003D9B; font-size: 32px; margin: 0 0 10px 0;">{{name}}</h1>
    <h2 style="color: #555555; font-size: 18px; margin: 0 0 5px 0;">{{currentPosition}}</h2>
    {{#if customerName}}
    <div style="color: #888888; font-size: 14px; font-style: italic; margin-bottom: 20px;">
      Tailored for: {{customerName}}
    </div>
    {{/if}}
  </div>

  <!-- Summary -->
  {{#if summary}}
  <div style="margin-bottom: 20px;">
    <h2 style="color: #003D9B; font-size: 16px; border-bottom: 2px solid #003D9B; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">Professional Summary</h2>
    <p style="font-size: 14px; margin: 0;">{{summary}}</p>
  </div>
  {{/if}}

  <!-- Core Competencies -->
  {{#if skillsAligned}}
  <div style="margin-bottom: 20px;">
    <h2 style="color: #003D9B; font-size: 16px; border-bottom: 2px solid #003D9B; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">Core Competencies</h2>
    <p style="font-size: 14px; margin: 0;">
      {{#each skillsAligned}}
        {{this}}{{#unless @last}} &bull; {{/unless}}
      {{/each}}
    </p>
  </div>
  {{/if}}

  <!-- Professional Experience -->
  {{#if experience}}
  <div style="margin-bottom: 20px;">
    <h2 style="color: #003D9B; font-size: 16px; border-bottom: 2px solid #003D9B; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">Professional Experience</h2>
    {{#each experience}}
    <div style="margin-bottom: 15px;">
      <div style="font-size: 14px; margin-bottom: 5px;">
        <strong style="color: #333333;">{{position}}</strong>
        <span style="color: #555555;"> | {{company}}</span>
        <span style="color: #888888; font-style: italic; float: right;">{{period}}</span>
      </div>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #333333;">
        {{#each tasks}}
        <li style="margin-bottom: 3px;">{{this}}</li>
        {{/each}}
      </ul>
    </div>
    {{/each}}
  </div>
  {{/if}}

  <!-- Academic Background -->
  {{#if academic}}
  <div style="margin-bottom: 20px;">
    <h2 style="color: #003D9B; font-size: 16px; border-bottom: 2px solid #003D9B; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">Academic Background</h2>
    {{#each academic}}
    <div style="font-size: 14px; margin-bottom: 5px;">
      <strong style="color: #333333;">{{qualification}}</strong>: {{institution}} | {{period}}
    </div>
    {{/each}}
  </div>
  {{/if}}

  <!-- Special Projects -->
  {{#if specialProjects}}
  <div style="margin-bottom: 20px;">
    <h2 style="color: #003D9B; font-size: 16px; border-bottom: 2px solid #003D9B; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">Special Projects</h2>
    {{#each specialProjects}}
    <div style="margin-bottom: 10px;">
      <strong style="font-size: 14px; color: #333333; display: block; margin-bottom: 3px;">{{title}}</strong>
      <p style="font-size: 14px; margin: 0;">{{brief}}</p>
    </div>
    {{/each}}
  </div>
  {{/if}}

  <!-- Certifications -->
  {{#if certifications}}
  <div style="margin-bottom: 20px;">
    <h2 style="color: #003D9B; font-size: 16px; border-bottom: 2px solid #003D9B; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">Certifications</h2>
    {{#each certifications}}
    <div style="font-size: 14px; margin-bottom: 5px;">
      <strong style="color: #333333;">{{name}}</strong>: {{issuer}} {{#if year}}&bull; {{year}}{{/if}}
    </div>
    {{/each}}
  </div>
  {{/if}}
</div>
`;
