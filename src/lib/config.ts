export interface FormFieldConfig {
  name: string
  label: string
  placeholder: string
  description: string
  type: 'text' | 'number' | 'url' | 'textarea'
  required: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  validationMessage?: string
}

export interface FormSectionConfig {
  id: string
  title: string
  description: string
  icon: string 
  fields: FormFieldConfig[]
}

export interface ApplicationConfig {
  // Admin Configuration
  adminDiscordIds: string[]

  // Age Requirements
  minimumAge: number

  // Form Configuration
  sections: FormSectionConfig[]

  // Validation Messages
  messages: {
    ageRequirement: string
    steamIdInvalid: string
    cfxUrlInvalid: string
    experienceMinLength: string
    characterMinLength: string
  }

  // Discord Bot Configuration
  discordBot: {
    serverName: string;
    serverIcon: string;
    footerText: string;
  };

  // UI Configuration
  ui: {
    formTitle: string;
    formDescription: string;
    submitButtonText: string;
    submittingButtonText: string;
    successTitle: string;
    successDescription: string;
    errorTitle: string;
    errorDescription: string;
  };
}
export const getAdminDiscordIds = () => applicationConfig.adminDiscordIds
export const getMinimumAge = () => applicationConfig.minimumAge
export const getFormSections = () => applicationConfig.sections
export const getFormField = (sectionId: string, fieldName: string) =>
    applicationConfig.sections
        .find(section => section.id === sectionId)
        ?.fields.find(field => field.name === fieldName)

export const isAdmin = (discordId: string | undefined): boolean => {
  return !!discordId && applicationConfig.adminDiscordIds.includes(discordId)
}

const minimumAge = 18;

export const applicationConfig: ApplicationConfig = {
  // Admin Discord IDs - Add your admin Discord user IDs here
  adminDiscordIds: [
    '770344107104010261', // Replace with actual admin IDs
    '123456789012345678', // Example admin ID
    '987654321098765432', // Example admin ID
  ],

  // Minimum age requirement for applications
  minimumAge: minimumAge,

  // Form sections and fields configuration
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic information about yourself',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      fields: [
        {
          name: 'characterName',
          label: 'In-Game Character Name',
          placeholder: 'Enter your character name',
          description: 'The character name you\'ll use in the server',
          type: 'text',
          required: true,
          minLength: 6,
          validationMessage: 'Character name must be at least 6 characters.',
        },
        {
          name: 'age',
          label: 'Age',
          placeholder: `${minimumAge}+`,
          description: `Must be ${minimumAge} or older to apply`,
          type: 'number',
          required: true,
          validationMessage: `You must be at least ${minimumAge} years old.`,
        },
      ],
    },
    {
      id: 'auth',
      title: 'Authentication Accounts',
      description: 'Your platform accounts',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      fields: [
        {
          name: 'steamId',
          label: 'Steam ID (17 digits)',
          placeholder: '76561198...',
          description: 'Find this on your Steam profile page',
          type: 'text',
          required: true,
          pattern: '^[0-9]{17}$',
          validationMessage: 'Invalid Steam ID. It should be a 17-digit number.',
        },
        {
          name: 'cfxAccount',
          label: 'CFX Forum Account',
          placeholder: 'https://forum.cfx.re/u/username',
          description: 'Your CFX forum profile URL',
          type: 'url',
          required: true,
          validationMessage: 'Please enter a valid CFX account URL.',
        },
      ],
    },
    {
      id: 'roleplay',
      title: 'Roleplay Background',
      description: 'Your roleplay experience and character details',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      fields: [
        {
          name: 'experience',
          label: 'Previous Roleplay Experience',
          placeholder: 'Describe your previous roleplay experience (minimum 50 characters)...',
          description: 'Tell us about your RP background and experience',
          type: 'textarea',
          required: true,
          minLength: 50,
          validationMessage: 'Please provide at least 50 characters about your RP experience.',
        },
        {
          name: 'character',
          label: 'Character Backstory',
          placeholder: 'Write your character\'s backstory (minimum 100 characters)...',
          description: 'Provide a detailed backstory for your character',
          type: 'textarea',
          required: true,
          minLength: 100,
          validationMessage: 'Please provide at least 100 characters about your character backstory.',
        },
      ],
    },
  ],

  messages: {
    ageRequirement: `You must be at least ${minimumAge} years old.`,
    steamIdInvalid: 'Invalid Steam ID. It should be a 17-digit number.',
    cfxUrlInvalid: 'Please enter a valid CFX account URL.',
    experienceMinLength: 'Please provide at least 50 characters about your RP experience.',
    characterMinLength: 'Please provide at least 100 characters about your character backstory.',
  },

  ui: {
    formTitle: 'Application Form',
    formDescription: 'Fill out all required information to submit your whitelist application',
    submitButtonText: 'Submit Application',
    submittingButtonText: 'Submitting Application...',
    successTitle: 'Application Submitted',
    successDescription: 'Your whitelist application has been received. We will review it shortly.',
    errorTitle: 'Submission Error',
    errorDescription: 'There was an error submitting your application. Please try again later.',
  },

  discordBot: {
    serverName: "Aura Development",
    serverIcon: "https://i.postimg.cc/X71XVpvP/LOGO-Aura-City-2000x2000-V2-by-Flight-Design.png",
    footerText: "© 2024 Aura Development - All rights reserved",
  },
}

/*
EXAMPLES: How to add more questions and categories

1. Adding questions to existing roleplay section:
   Add these fields to the 'roleplay' section fields array:

   {
     name: 'motivation',
     label: 'What motivates your character?',
     placeholder: 'Describe what drives your character...',
     description: 'Explain your character\'s main motivations and goals',
     type: 'textarea',
     required: true,
     minLength: 50,
     validationMessage: 'Please provide at least 50 characters about your character\'s motivation.',
   },
   {
     name: 'weaknesses',
     label: 'Character Weaknesses',
     placeholder: 'What are your character\'s flaws and weaknesses?',
     description: 'Describe character flaws that make them more realistic',
     type: 'textarea',
     required: false,
     minLength: 30,
   }

2. Creating a new category/section:
   Add this object to the sections array:

   {
     id: 'background',
     title: 'Background & History',
     description: 'Detailed background information',
     icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
     fields: [
       {
         name: 'birthplace',
         label: 'Place of Birth',
         placeholder: 'City, State/Country',
         description: 'Where was your character born?',
         type: 'text',
         required: true,
       },
       {
         name: 'occupation',
         label: 'Previous Occupation',
         placeholder: 'What did your character do before?',
         description: 'Character\'s job/career before current events',
         type: 'text',
         required: true,
       },
       {
         name: 'education',
         label: 'Education Level',
         placeholder: 'High school, college, etc.',
         description: 'Highest level of education completed',
         type: 'text',
         required: false,
       }
     ],
   }

3. Adding a references section:
   {
     id: 'references',
     title: 'References',
     description: 'People who can vouch for you',
     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
     fields: [
       {
         name: 'reference1',
         label: 'Reference 1 Discord Username',
         placeholder: '@username#1234',
         description: 'Someone who can vouch for your RP ability',
         type: 'text',
         required: false,
       },
       {
         name: 'reference2',
         label: 'Reference 2 Discord Username',
         placeholder: '@username#1234',
         description: 'Another person who knows your RP style',
         type: 'text',
         required: false,
       }
     ],
   }

4. Adding a rules agreement section:
   {
     id: 'rules',
     title: 'Server Rules Agreement',
     description: 'Confirm you understand our rules',
     icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
     fields: [
       {
         name: 'rulesAccepted',
         label: 'I have read and agree to follow all server rules',
         placeholder: '',
         description: 'You must accept the rules to apply',
         type: 'text', // Note: This would need custom checkbox implementation
         required: true,
         validationMessage: 'You must accept the server rules to continue.',
       }
     ],
   }

Remember to update the form schema generation in whitelist-form.tsx to handle new field types!
*/