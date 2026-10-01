// @ts-check
/**
 * @file modelRegistryData.js
 * Source-of-truth technical model inventory across all 109 Tavi registry languages.
 * 
 * STRICT TECHNICAL SEPARATION:
 * Contains objective technical capabilities, engine definitions, model formats,
 * artifact locations, checksums (where verified), sample rates, and raw provenance/lineage facts.
 * Commercial policy decisions (Standard A vs. Standard B) are intentionally NOT evaluated here.
 * 
 * Metrics:
 * - 109 Languages (100% of registry)
 * - 81 Local Neural Capable (41 LOCAL_NEURAL, 40 LOCAL_NEURAL_RESEARCH)
 * - 28 Subtitle-Only (SUBTITLE_ONLY)
 */

export const RAW_LANGUAGE_ENTRIES = [
  {
    "languageCode": "af",
    "languageName": "Afrikaans",
    "iso639_2": "afr",
    "bcp47": "af-ZA",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sq",
    "languageName": "Albanian",
    "iso639_2": "sqi",
    "bcp47": "sq-AL",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:sq_AL-edon-medium",
      "languageCode": "sq",
      "languageName": "Albanian",
      "bcp47": "sq-AL",
      "engine": "piper",
      "modelName": "sq_AL-edon-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sq/sq_AL/edon/medium/sq_AL-edon-medium.onnx",
      "artifactPath": "sq/sq_AL/edon/medium/sq_AL-edon-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "01888cba8f112271d2cdb6c9de17aae7",
      "sizeBytes": 63511038,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-sqi",
        "languageCode": "sq",
        "languageName": "Albanian",
        "bcp47": "sq-AL",
        "engine": "mms",
        "modelName": "facebook/mms-tts-sqi",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-sqi",
        "artifactPath": "models/mms/facebook_mms-tts-sqi",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "am",
    "languageName": "Amharic",
    "iso639_2": "amh",
    "bcp47": "am-ET",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-amh",
      "languageCode": "am",
      "languageName": "Amharic",
      "bcp47": "am-ET",
      "engine": "mms",
      "modelName": "facebook/mms-tts-amh",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-amh",
      "artifactPath": "models/mms/facebook_mms-tts-amh",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ar",
    "languageName": "Arabic",
    "iso639_2": "ara",
    "bcp47": "ar-SA",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ar_JO-kareem-medium",
      "languageCode": "ar",
      "languageName": "Arabic",
      "bcp47": "ar-JO",
      "engine": "piper",
      "modelName": "ar_JO-kareem-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx",
      "artifactPath": "ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "c0697df8a7fb180079cc5ac523f91a8e",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:ar_JO-kareem-low",
        "languageCode": "ar",
        "languageName": "Arabic",
        "bcp47": "ar-JO",
        "engine": "piper",
        "modelName": "ar_JO-kareem-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ar/ar_JO/kareem/low/ar_JO-kareem-low.onnx",
        "artifactPath": "ar/ar_JO/kareem/low/ar_JO-kareem-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "d335cd06fe4045a7ee9d8fb0712afaa9",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Non-Commercial / Lessac Base",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-ara",
        "languageCode": "ar",
        "languageName": "Arabic",
        "bcp47": "ar-SA",
        "engine": "mms",
        "modelName": "facebook/mms-tts-ara",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-ara",
        "artifactPath": "models/mms/facebook_mms-tts-ara",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "hy",
    "languageName": "Armenian",
    "iso639_2": "hye",
    "bcp47": "hy-AM",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:hy_AM-gor-medium",
      "languageCode": "hy",
      "languageName": "Armenian",
      "bcp47": "hy-AM",
      "engine": "piper",
      "modelName": "hy_AM-gor-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hy/hy_AM/gor/medium/hy_AM-gor-medium.onnx",
      "artifactPath": "hy/hy_AM/gor/medium/hy_AM-gor-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "fd726714c656f1cad828bcf102059aa1",
      "sizeBytes": 63511038,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "as",
    "languageName": "Assamese",
    "iso639_2": "asm",
    "bcp47": "as-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-asm",
      "languageCode": "as",
      "languageName": "Assamese",
      "bcp47": "as-IN",
      "engine": "mms",
      "modelName": "facebook/mms-tts-asm",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-asm",
      "artifactPath": "models/mms/facebook_mms-tts-asm",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "az",
    "languageName": "Azerbaijani",
    "iso639_2": "aze",
    "bcp47": "az-AZ",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-azj-script_latin",
      "languageCode": "az",
      "languageName": "Azerbaijani",
      "bcp47": "az-AZ",
      "engine": "mms",
      "modelName": "facebook/mms-tts-azj-script_latin",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-azj-script_latin",
      "artifactPath": "models/mms/facebook_mms-tts-azj-script_latin",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-azj-script_cyrillic",
        "languageCode": "az",
        "languageName": "Azerbaijani",
        "bcp47": "az-AZ",
        "engine": "mms",
        "modelName": "facebook/mms-tts-azj-script_cyrillic",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-azj-script_cyrillic",
        "artifactPath": "models/mms/facebook_mms-tts-azj-script_cyrillic",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-azb",
        "languageCode": "az",
        "languageName": "Azerbaijani",
        "bcp47": "az-AZ",
        "engine": "mms",
        "modelName": "facebook/mms-tts-azb",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-azb",
        "artifactPath": "models/mms/facebook_mms-tts-azb",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "eu",
    "languageName": "Basque",
    "iso639_2": "eus",
    "bcp47": "eu-ES",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:eu_ES-antton-medium",
      "languageCode": "eu",
      "languageName": "Basque",
      "bcp47": "eu-ES",
      "engine": "piper",
      "modelName": "eu_ES-antton-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/eu/eu_ES/antton/medium/eu_ES-antton-medium.onnx",
      "artifactPath": "eu/eu_ES/antton/medium/eu_ES-antton-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "4d924421c8f4f3967e79de798209e593",
      "sizeBytes": 63531379,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "isFinetuned": true,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:eu_ES-maider-medium",
        "languageCode": "eu",
        "languageName": "Basque",
        "bcp47": "eu-ES",
        "engine": "piper",
        "modelName": "eu_ES-maider-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/eu/eu_ES/maider/medium/eu_ES-maider-medium.onnx",
        "artifactPath": "eu/eu_ES/maider/medium/eu_ES-maider-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "0e479a47183ccee8b559e3c69c0a4d96",
        "sizeBytes": 63531379,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Fine-tuned acoustic model",
        "isFinetuned": true,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-eus",
        "languageCode": "eu",
        "languageName": "Basque",
        "bcp47": "eu-ES",
        "engine": "mms",
        "modelName": "facebook/mms-tts-eus",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-eus",
        "artifactPath": "models/mms/facebook_mms-tts-eus",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "be",
    "languageName": "Belarusian",
    "iso639_2": "bel",
    "bcp47": "be-BY",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "bn",
    "languageName": "Bengali",
    "iso639_2": "ben",
    "bcp47": "bn-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:bn_BD-google-medium",
      "languageCode": "bn",
      "languageName": "Bengali",
      "bcp47": "bn-BD",
      "engine": "piper",
      "modelName": "bn_BD-google-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/bn/bn_BD/google/medium/bn_BD-google-medium.onnx",
      "artifactPath": "bn/bn_BD/google/medium/bn_BD-google-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "2a365b2d91bb9cb7ed62c57d9ee0ec48",
      "sizeBytes": 76782515,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "CC-BY-SA 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "isFinetuned": true,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-ben",
        "languageCode": "bn",
        "languageName": "Bengali",
        "bcp47": "bn-IN",
        "engine": "mms",
        "modelName": "facebook/mms-tts-ben",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-ben",
        "artifactPath": "models/mms/facebook_mms-tts-ben",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-SA 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "bho",
    "languageName": "Bhojpuri",
    "iso639_2": "bho",
    "bcp47": "bho-IN",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "bi",
    "languageName": "Bislama",
    "iso639_2": "bis",
    "bcp47": "bi-VU",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-bis",
      "languageCode": "bi",
      "languageName": "Bislama",
      "bcp47": "bi-VU",
      "engine": "mms",
      "modelName": "facebook/mms-tts-bis",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-bis",
      "artifactPath": "models/mms/facebook_mms-tts-bis",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "bg",
    "languageName": "Bulgarian",
    "iso639_2": "bul",
    "bcp47": "bg-BG",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:bg_BG-dimitar-medium",
      "languageCode": "bg",
      "languageName": "Bulgarian",
      "bcp47": "bg-BG",
      "engine": "piper",
      "modelName": "bg_BG-dimitar-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/bg/bg_BG/dimitar/medium/bg_BG-dimitar-medium.onnx",
      "artifactPath": "bg/bg_BG/dimitar/medium/bg_BG-dimitar-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "fc1ce62a4f04f089e22b8c3a13bde28a",
      "sizeBytes": 63221984,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-bul",
        "languageCode": "bg",
        "languageName": "Bulgarian",
        "bcp47": "bg-BG",
        "engine": "mms",
        "modelName": "facebook/mms-tts-bul",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-bul",
        "artifactPath": "models/mms/facebook_mms-tts-bul",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "my",
    "languageName": "Burmese",
    "iso639_2": "mya",
    "bcp47": "my-MM",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-mya",
      "languageCode": "my",
      "languageName": "Burmese",
      "bcp47": "my-MM",
      "engine": "mms",
      "modelName": "facebook/mms-tts-mya",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-mya",
      "artifactPath": "models/mms/facebook_mms-tts-mya",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "yue",
    "languageName": "Cantonese",
    "iso639_2": "yue",
    "bcp47": "zh-HK",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ca",
    "languageName": "Catalan",
    "iso639_2": "cat",
    "bcp47": "ca-ES",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ca_ES-upc_ona-medium",
      "languageCode": "ca",
      "languageName": "Catalan",
      "bcp47": "ca-ES",
      "engine": "piper",
      "modelName": "ca_ES-upc_ona-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ca/ca_ES/upc_ona/medium/ca_ES-upc_ona-medium.onnx",
      "artifactPath": "ca/ca_ES/upc_ona/medium/ca_ES-upc_ona-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "58ff3b049b6b721a4c353a551ec5ef3a",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY-SA 3.0 ES",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:ca_ES-upc_ona-x_low",
        "languageCode": "ca",
        "languageName": "Catalan",
        "bcp47": "ca-ES",
        "engine": "piper",
        "modelName": "ca_ES-upc_ona-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ca/ca_ES/upc_ona/x_low/ca_ES-upc_ona-x_low.onnx",
        "artifactPath": "ca/ca_ES/upc_ona/x_low/ca_ES-upc_ona-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "ca22734cd8c5b01dd1fefbb42067ab06",
        "sizeBytes": 20628813,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY-SA 3.0 ES",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:ca_ES-upc_pau-x_low",
        "languageCode": "ca",
        "languageName": "Catalan",
        "bcp47": "ca-ES",
        "engine": "piper",
        "modelName": "ca_ES-upc_pau-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ca/ca_ES/upc_pau/x_low/ca_ES-upc_pau-x_low.onnx",
        "artifactPath": "ca/ca_ES/upc_pau/x_low/ca_ES-upc_pau-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "504e8a643d5284fbfc95e9e392288b86",
        "sizeBytes": 28130791,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY-SA 3.0 ES",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-cat",
        "languageCode": "ca",
        "languageName": "Catalan",
        "bcp47": "ca-ES",
        "engine": "mms",
        "modelName": "facebook/mms-tts-cat",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-cat",
        "artifactPath": "models/mms/facebook_mms-tts-cat",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-SA 3.0 ES",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ceb",
    "languageName": "Cebuano",
    "iso639_2": "ceb",
    "bcp47": "ceb-PH",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-ceb",
      "languageCode": "ceb",
      "languageName": "Cebuano",
      "bcp47": "ceb-PH",
      "engine": "mms",
      "modelName": "facebook/mms-tts-ceb",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-ceb",
      "artifactPath": "models/mms/facebook_mms-tts-ceb",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ch",
    "languageName": "Chamorro",
    "iso639_2": "cha",
    "bcp47": "ch-GU",
    "translationCapability": false,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "zh",
    "languageName": "Chinese (Mandarin)",
    "iso639_2": "zho",
    "bcp47": "zh-CN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "kokoro",
    "canonicalModel": {
      "modelId": "kokoro:zh_CN-huayan",
      "languageCode": "zh",
      "languageName": "Chinese (Mandarin)",
      "bcp47": "zh-CN",
      "engine": "kokoro",
      "modelName": "Kokoro-82M",
      "modelType": "onnx-kokoro",
      "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
      "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": 86200000,
      "sampleRate": 24000,
      "voiceGenders": [
        "female",
        "male"
      ],
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:zh_CN-chaowen-medium",
        "languageCode": "zh",
        "languageName": "Chinese (Mandarin)",
        "bcp47": "zh-CN",
        "engine": "piper",
        "modelName": "zh_CN-chaowen-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/chaowen/medium/zh_CN-chaowen-medium.onnx",
        "artifactPath": "zh/zh_CN/chaowen/medium/zh_CN-chaowen-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "4965c46e983653811bef0253026ff45a",
        "sizeBytes": 63221984,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:zh_CN-huayan-medium",
        "languageCode": "zh",
        "languageName": "Chinese (Mandarin)",
        "bcp47": "zh-CN",
        "engine": "piper",
        "modelName": "zh_CN-huayan-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx",
        "artifactPath": "zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "40cdb7930ff91b81574d5f0489e076ea",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:zh_CN-huayan-x_low",
        "languageCode": "zh",
        "languageName": "Chinese (Mandarin)",
        "bcp47": "zh-CN",
        "engine": "piper",
        "modelName": "zh_CN-huayan-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/x_low/zh_CN-huayan-x_low.onnx",
        "artifactPath": "zh/zh_CN/huayan/x_low/zh_CN-huayan-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "2b96570db6becd09814a608c8d14a64f",
        "sizeBytes": 20628813,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:zh_CN-xiao_ya-medium",
        "languageCode": "zh",
        "languageName": "Chinese (Mandarin)",
        "bcp47": "zh-CN",
        "engine": "piper",
        "modelName": "zh_CN-xiao_ya-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/xiao_ya/medium/zh_CN-xiao_ya-medium.onnx",
        "artifactPath": "zh/zh_CN/xiao_ya/medium/zh_CN-xiao_ya-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "b1cece47c5d601a8f6b63b8da82b484a",
        "sizeBytes": 63221984,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "hr",
    "languageName": "Croatian",
    "iso639_2": "hrv",
    "bcp47": "hr-HR",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "cs",
    "languageName": "Czech",
    "iso639_2": "ces",
    "bcp47": "cs-CZ",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:cs_CZ-jirka-medium",
      "languageCode": "cs",
      "languageName": "Czech",
      "bcp47": "cs-CZ",
      "engine": "piper",
      "modelName": "cs_CZ-jirka-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium.onnx",
      "artifactPath": "cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "da2deb0a3f93226a3f9b6e40d43c46ca",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:cs_CZ-jirka-low",
        "languageCode": "cs",
        "languageName": "Czech",
        "bcp47": "cs-CZ",
        "engine": "piper",
        "modelName": "cs_CZ-jirka-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cs/cs_CZ/jirka/low/cs_CZ-jirka-low.onnx",
        "artifactPath": "cs/cs_CZ/jirka/low/cs_CZ-jirka-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "82b99b7adeaccf9fec011458623405b2",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:cs_CZ-kasandra-medium",
        "languageCode": "cs",
        "languageName": "Czech",
        "bcp47": "cs-CZ",
        "engine": "piper",
        "modelName": "cs_CZ-kasandra-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cs/cs_CZ/kasandra/medium/cs_CZ-kasandra-medium.onnx",
        "artifactPath": "cs/cs_CZ/kasandra/medium/cs_CZ-kasandra-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "4b74926a8e7a25e86e1bdb01a25bae66",
        "sizeBytes": 63511038,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "da",
    "languageName": "Danish",
    "iso639_2": "dan",
    "bcp47": "da-DK",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:da_DK-talesyntese-medium",
      "languageCode": "da",
      "languageName": "Danish",
      "bcp47": "da-DK",
      "engine": "piper",
      "modelName": "da_DK-talesyntese-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx",
      "artifactPath": "da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "9c05494a3e0c1136337581e01222395d",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "doi",
    "languageName": "Dogri",
    "iso639_2": "doi",
    "bcp47": "doi-IN",
    "translationCapability": false,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "nl",
    "languageName": "Dutch",
    "iso639_2": "nld",
    "bcp47": "nl-NL",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:nl_BE-rdh-medium",
      "languageCode": "nl",
      "languageName": "Dutch",
      "bcp47": "nl-BE",
      "engine": "piper",
      "modelName": "nl_BE-rdh-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_BE/rdh/medium/nl_BE-rdh-medium.onnx",
      "artifactPath": "nl/nl_BE/rdh/medium/nl_BE-rdh-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "33d3469d745677ec4d7e96eb4145b09e",
      "sizeBytes": 63104526,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:nl_BE-nathalie-medium",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-BE",
        "engine": "piper",
        "modelName": "nl_BE-nathalie-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_BE/nathalie/medium/nl_BE-nathalie-medium.onnx",
        "artifactPath": "nl/nl_BE/nathalie/medium/nl_BE-nathalie-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "ab0c38b5f66764b59ad9e3e98b1c2172",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:nl_BE-nathalie-x_low",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-BE",
        "engine": "piper",
        "modelName": "nl_BE-nathalie-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_BE/nathalie/x_low/nl_BE-nathalie-x_low.onnx",
        "artifactPath": "nl/nl_BE/nathalie/x_low/nl_BE-nathalie-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "4a00803b60caecad30ea612bcd9f9344",
        "sizeBytes": 20628813,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:nl_BE-rdh-x_low",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-BE",
        "engine": "piper",
        "modelName": "nl_BE-rdh-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_BE/rdh/x_low/nl_BE-rdh-x_low.onnx",
        "artifactPath": "nl/nl_BE/rdh/x_low/nl_BE-rdh-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "7d60d0de9ad9ec11a1d293665743afda",
        "sizeBytes": 20628813,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:nl_NL-alex-medium",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-NL",
        "engine": "piper",
        "modelName": "nl_NL-alex-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/alex/medium/nl_NL-alex-medium.onnx",
        "artifactPath": "nl/nl_NL/alex/medium/nl_NL-alex-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "34c3e80cedc491e5d943091cd1b45192",
        "sizeBytes": 63531476,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:nl_NL-mls-medium",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-NL",
        "engine": "piper",
        "modelName": "nl_NL-mls-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx",
        "artifactPath": "nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "f1d4b1452ccfdac24be72085b2b6b55c",
        "sizeBytes": 76584246,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:nl_NL-mls_5809-low",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-NL",
        "engine": "piper",
        "modelName": "nl_NL-mls_5809-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls_5809/low/nl_NL-mls_5809-low.onnx",
        "artifactPath": "nl/nl_NL/mls_5809/low/nl_NL-mls_5809-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "e69130a776b04c9962a1fefb4878d7d9",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:nl_NL-mls_7432-low",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-NL",
        "engine": "piper",
        "modelName": "nl_NL-mls_7432-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls_7432/low/nl_NL-mls_7432-low.onnx",
        "artifactPath": "nl/nl_NL/mls_7432/low/nl_NL-mls_7432-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "044b69d583e191203997761434607273",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:nl_NL-pim-medium",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-NL",
        "engine": "piper",
        "modelName": "nl_NL-pim-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/pim/medium/nl_NL-pim-medium.onnx",
        "artifactPath": "nl/nl_NL/pim/medium/nl_NL-pim-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "190b3e6463a931d3c583d2fa7cd0e4a0",
        "sizeBytes": 63516050,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:nl_NL-ronnie-medium",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-NL",
        "engine": "piper",
        "modelName": "nl_NL-ronnie-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/ronnie/medium/nl_NL-ronnie-medium.onnx",
        "artifactPath": "nl/nl_NL/ronnie/medium/nl_NL-ronnie-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "f74c8e7779cb05f935367d661de5b380",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-nld",
        "languageCode": "nl",
        "languageName": "Dutch",
        "bcp47": "nl-NL",
        "engine": "mms",
        "modelName": "facebook/mms-tts-nld",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-nld",
        "artifactPath": "models/mms/facebook_mms-tts-nld",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "en",
    "languageName": "English",
    "iso639_2": "eng",
    "bcp47": "en-US",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "kokoro",
    "canonicalModel": {
      "modelId": "kokoro:en_US-bryce",
      "languageCode": "en",
      "languageName": "English",
      "bcp47": "en-US",
      "engine": "kokoro",
      "modelName": "Kokoro-82M",
      "modelType": "onnx-kokoro",
      "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
      "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": 86200000,
      "sampleRate": 24000,
      "voiceGenders": [
        "male",
        "female"
      ],
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:en_GB-alan-low",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-alan-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/low/en_GB-alan-low.onnx",
        "artifactPath": "en/en_GB/alan/low/en_GB-alan-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "2acae8c79395ab109a7572f0afa61fff",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-alan-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-alan-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx",
        "artifactPath": "en/en_GB/alan/medium/en_GB-alan-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "8f6b35eeb8ef6269021c6cb6d2414c9b",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-alba-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-alba-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx",
        "artifactPath": "en/en_GB/alba/medium/en_GB-alba-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "c07f313752bb3aba8061041666251654",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-aru-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-aru-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/aru/medium/en_GB-aru-medium.onnx",
        "artifactPath": "en/en_GB/aru/medium/en_GB-aru-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "7862d75539b8ef867e7c04e772d323ea",
        "sizeBytes": 76754097,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-cori-high",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-cori-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/high/en_GB-cori-high.onnx",
        "artifactPath": "en/en_GB/cori/high/en_GB-cori-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "3474a80133d9a03e6870d2ac42c18806",
        "sizeBytes": 114219352,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-cori-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-cori-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/medium/en_GB-cori-medium.onnx",
        "artifactPath": "en/en_GB/cori/medium/en_GB-cori-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "f143307611eccea9d976235d0895f57c",
        "sizeBytes": 63531379,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-jenny_dioco-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-jenny_dioco-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx",
        "artifactPath": "en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "d08f2f7edf0c858275a7eca74ff2a9e4",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-northern_english_male-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-northern_english_male-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx",
        "artifactPath": "en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "4c9a9735bfb76ad67c8b31b23d6840a0",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-semaine-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-semaine-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/semaine/medium/en_GB-semaine-medium.onnx",
        "artifactPath": "en/en_GB/semaine/medium/en_GB-semaine-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "3634c3b388165d3b698ea07ba3cac7d2",
        "sizeBytes": 76737711,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-southern_english_female-low",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-southern_english_female-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/southern_english_female/low/en_GB-southern_english_female-low.onnx",
        "artifactPath": "en/en_GB/southern_english_female/low/en_GB-southern_english_female-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "596c7ed4d8488cf64e027765dce2dad1",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_GB-vctk-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-GB",
        "engine": "piper",
        "modelName": "en_GB-vctk-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/vctk/medium/en_GB-vctk-medium.onnx",
        "artifactPath": "en/en_GB/vctk/medium/en_GB-vctk-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "573025290fdc68812543b7438ace0c29",
        "sizeBytes": 76952753,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-amy-low",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-amy-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/low/en_US-amy-low.onnx",
        "artifactPath": "en/en_US/amy/low/en_US-amy-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "3c3f6a6ec605f3a59763256d3b2db012",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-amy-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-amy-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx",
        "artifactPath": "en/en_US/amy/medium/en_US-amy-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "778d28aeb95fcdf8a882344d9df142fc",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-arctic-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-arctic-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/arctic/medium/en_US-arctic-medium.onnx",
        "artifactPath": "en/en_US/arctic/medium/en_US-arctic-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "497c47037c2e279faf467e0a06f965d2",
        "sizeBytes": 76766385,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-bryce-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-bryce-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/bryce/medium/en_US-bryce-medium.onnx",
        "artifactPath": "en/en_US/bryce/medium/en_US-bryce-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "a8482817c3bdc3d20121a0e31bfa9809",
        "sizeBytes": 63531379,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-danny-low",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-danny-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/danny/low/en_US-danny-low.onnx",
        "artifactPath": "en/en_US/danny/low/en_US-danny-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "73cc296e178ab3d2a5698179b629cd12",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-hfc_female-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-hfc_female-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx",
        "artifactPath": "en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "7abec91f1d6e19e913fbc4a333f62787",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-hfc_male-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-hfc_male-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx",
        "artifactPath": "en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "cd2fda1933f0653d3ddc85e5f30ebdd2",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-joe-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-joe-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx",
        "artifactPath": "en/en_US/joe/medium/en_US-joe-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "74fd6a4dc39e0aa9dce145d7f5acd4f6",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-john-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-john-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/john/medium/en_US-john-medium.onnx",
        "artifactPath": "en/en_US/john/medium/en_US-john-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "70480857f21f2560f3a232722023b36d",
        "sizeBytes": 63531379,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-kathleen-low",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-kathleen-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx",
        "artifactPath": "en/en_US/kathleen/low/en_US-kathleen-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "dd1ab131724b1cff76fe388252bec47b",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-kristin-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-kristin-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kristin/medium/en_US-kristin-medium.onnx",
        "artifactPath": "en/en_US/kristin/medium/en_US-kristin-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "5fed42d2296baca042e2bf74785db725",
        "sizeBytes": 63531379,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-kusal-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-kusal-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kusal/medium/en_US-kusal-medium.onnx",
        "artifactPath": "en/en_US/kusal/medium/en_US-kusal-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "95334de7385a03c5c9de25b920c33492",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-l2arctic-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-l2arctic-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/l2arctic/medium/en_US-l2arctic-medium.onnx",
        "artifactPath": "en/en_US/l2arctic/medium/en_US-l2arctic-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "a71d8acf9b01676931cd548f739382cd",
        "sizeBytes": 76778673,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-lessac-high",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-lessac-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx",
        "artifactPath": "en/en_US/lessac/high/en_US-lessac-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "99d1f6181a7f5ccbe3f117ba8ce63c93",
        "sizeBytes": 113895201,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-lessac-low",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-lessac-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/low/en_US-lessac-low.onnx",
        "artifactPath": "en/en_US/lessac/low/en_US-lessac-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "31883a7506589feadf3c3474fd8ef658",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-lessac-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-lessac-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
        "artifactPath": "en/en_US/lessac/medium/en_US-lessac-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "2fc642b535197b6305c7c8f92dc8b24f",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-libritts-high",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-libritts-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts/high/en_US-libritts-high.onnx",
        "artifactPath": "en/en_US/libritts/high/en_US-libritts-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "61d7845257f8abdc27476f606151ef8d",
        "sizeBytes": 136673811,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-libritts_r-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-libritts_r-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx",
        "artifactPath": "en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "bb2c2776cffbfd736c7c497f620c0ca6",
        "sizeBytes": 78580914,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-ljspeech-high",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-ljspeech-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx",
        "artifactPath": "en/en_US/ljspeech/high/en_US-ljspeech-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "dad093b5d2cff6a5fda99883ceda09d1",
        "sizeBytes": 114199011,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-ljspeech-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-ljspeech-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx",
        "artifactPath": "en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "109d552e9dd78d92d1169a7edd6de38d",
        "sizeBytes": 63531379,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-mike-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-mike-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/mike/medium/en_US-mike-medium.onnx",
        "artifactPath": "en/en_US/mike/medium/en_US-mike-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "032952405bbd4eeae409385cde31b8c5",
        "sizeBytes": 63221984,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-norman-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-norman-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/norman/medium/en_US-norman-medium.onnx",
        "artifactPath": "en/en_US/norman/medium/en_US-norman-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "829cea515dc724d694b83b71e8083f9f",
        "sizeBytes": 63531379,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-reza_ibrahim-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-reza_ibrahim-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/reza_ibrahim/medium/en_US-reza_ibrahim-medium.onnx",
        "artifactPath": "en/en_US/reza_ibrahim/medium/en_US-reza_ibrahim-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "b9d4059c794df8336060fb7f36264a43",
        "sizeBytes": 63511038,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-ryan-high",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-ryan-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx",
        "artifactPath": "en/en_US/ryan/high/en_US-ryan-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "5d879a17bddf5007f76655b445ba78b4",
        "sizeBytes": 120786792,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-ryan-low",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-ryan-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/low/en_US-ryan-low.onnx",
        "artifactPath": "en/en_US/ryan/low/en_US-ryan-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "32f6a995d6d561cd040b20a76f4edb1e",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-ryan-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-ryan-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx",
        "artifactPath": "en/en_US/ryan/medium/en_US-ryan-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "8f06d3aff8ded5a7f13f907e6bec32ac",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:en_US-sam-medium",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "piper",
        "modelName": "en_US-sam-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/sam/medium/en_US-sam-medium.onnx",
        "artifactPath": "en/en_US/sam/medium/en_US-sam-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "57efcb38a3d0510051f9f55c517ccb76",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-eng",
        "languageCode": "en",
        "languageName": "English",
        "bcp47": "en-US",
        "engine": "mms",
        "modelName": "facebook/mms-tts-eng",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-eng",
        "artifactPath": "models/mms/facebook_mms-tts-eng",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "et",
    "languageName": "Estonian",
    "iso639_2": "est",
    "bcp47": "et-EE",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:et_EE-news-medium",
      "languageCode": "et",
      "languageName": "Estonian",
      "bcp47": "et-EE",
      "engine": "piper",
      "modelName": "et_EE-news-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/et/et_EE/news/medium/et_EE-news-medium.onnx",
      "artifactPath": "et/et_EE/news/medium/et_EE-news-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "6fba6ec8d985e84435ce680ee9d3b0bc",
      "sizeBytes": 76757937,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "CC-BY",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "isFinetuned": true,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "fj",
    "languageName": "Fijian",
    "iso639_2": "fij",
    "bcp47": "fj-FJ",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-fij",
      "languageCode": "fj",
      "languageName": "Fijian",
      "bcp47": "fj-FJ",
      "engine": "mms",
      "modelName": "facebook/mms-tts-fij",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-fij",
      "artifactPath": "models/mms/facebook_mms-tts-fij",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "tl",
    "languageName": "Filipino (Tagalog)",
    "iso639_2": "tgl",
    "bcp47": "fil-PH",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-tgl",
      "languageCode": "tl",
      "languageName": "Filipino (Tagalog)",
      "bcp47": "fil-PH",
      "engine": "mms",
      "modelName": "facebook/mms-tts-tgl",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-tgl",
      "artifactPath": "models/mms/facebook_mms-tts-tgl",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "fi",
    "languageName": "Finnish",
    "iso639_2": "fin",
    "bcp47": "fi-FI",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:fi_FI-harri-medium",
      "languageCode": "fi",
      "languageName": "Finnish",
      "bcp47": "fi-FI",
      "engine": "piper",
      "modelName": "fi_FI-harri-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx",
      "artifactPath": "fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "8e96b9e765f8db3e910943520aa0f475",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:fi_FI-harri-low",
        "languageCode": "fi",
        "languageName": "Finnish",
        "bcp47": "fi-FI",
        "engine": "piper",
        "modelName": "fi_FI-harri-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fi/fi_FI/harri/low/fi_FI-harri-low.onnx",
        "artifactPath": "fi/fi_FI/harri/low/fi_FI-harri-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "f44b67203de7fd488eabc4692d30b598",
        "sizeBytes": 69795191,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-fin",
        "languageCode": "fi",
        "languageName": "Finnish",
        "bcp47": "fi-FI",
        "engine": "mms",
        "modelName": "facebook/mms-tts-fin",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-fin",
        "artifactPath": "models/mms/facebook_mms-tts-fin",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "fr",
    "languageName": "French",
    "iso639_2": "fra",
    "bcp47": "fr-FR",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "kokoro",
    "canonicalModel": {
      "modelId": "kokoro:fr_FR-siwis",
      "languageCode": "fr",
      "languageName": "French",
      "bcp47": "fr-FR",
      "engine": "kokoro",
      "modelName": "Kokoro-82M",
      "modelType": "onnx-kokoro",
      "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
      "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": 86200000,
      "sampleRate": 24000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:fr_FR-gilles-low",
        "languageCode": "fr",
        "languageName": "French",
        "bcp47": "fr-FR",
        "engine": "piper",
        "modelName": "fr_FR-gilles-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/gilles/low/fr_FR-gilles-low.onnx",
        "artifactPath": "fr/fr_FR/gilles/low/fr_FR-gilles-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "f984386d1f0927597f09a3ec10b11b5d",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fr_FR-mls-medium",
        "languageCode": "fr",
        "languageName": "French",
        "bcp47": "fr-FR",
        "engine": "piper",
        "modelName": "fr_FR-mls-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx",
        "artifactPath": "fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "87831389d3ae92347d91e38b0c57add9",
        "sizeBytes": 76733750,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fr_FR-mls_1840-low",
        "languageCode": "fr",
        "languageName": "French",
        "bcp47": "fr-FR",
        "engine": "piper",
        "modelName": "fr_FR-mls_1840-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/mls_1840/low/fr_FR-mls_1840-low.onnx",
        "artifactPath": "fr/fr_FR/mls_1840/low/fr_FR-mls_1840-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "1873b5d95cb0aad9909d32d1747ae72b",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fr_FR-siwis-low",
        "languageCode": "fr",
        "languageName": "French",
        "bcp47": "fr-FR",
        "engine": "piper",
        "modelName": "fr_FR-siwis-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/low/fr_FR-siwis-low.onnx",
        "artifactPath": "fr/fr_FR/siwis/low/fr_FR-siwis-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "fcb614122005d70f27e4e61e58b4bb56",
        "sizeBytes": 28130791,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fr_FR-siwis-medium",
        "languageCode": "fr",
        "languageName": "French",
        "bcp47": "fr-FR",
        "engine": "piper",
        "modelName": "fr_FR-siwis-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
        "artifactPath": "fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "20e876e8c839e9b11a26085858f2300c",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fr_FR-tom-medium",
        "languageCode": "fr",
        "languageName": "French",
        "bcp47": "fr-FR",
        "engine": "piper",
        "modelName": "fr_FR-tom-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx",
        "artifactPath": "fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "5b460c2394a871e675f5c798af149412",
        "sizeBytes": 63511038,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fr_FR-upmc-medium",
        "languageCode": "fr",
        "languageName": "French",
        "bcp47": "fr-FR",
        "engine": "piper",
        "modelName": "fr_FR-upmc-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx",
        "artifactPath": "fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "6837ede9408c7e1b39fa4a126af9e865",
        "sizeBytes": 76733615,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-fra",
        "languageCode": "fr",
        "languageName": "French",
        "bcp47": "fr-FR",
        "engine": "mms",
        "modelName": "facebook/mms-tts-fra",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-fra",
        "artifactPath": "models/mms/facebook_mms-tts-fra",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "gl",
    "languageName": "Galician",
    "iso639_2": "glg",
    "bcp47": "gl-ES",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ka",
    "languageName": "Georgian",
    "iso639_2": "kat",
    "bcp47": "ka-GE",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ka_GE-natia-medium",
      "languageCode": "ka",
      "languageName": "Georgian",
      "bcp47": "ka-GE",
      "engine": "piper",
      "modelName": "ka_GE-natia-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ka/ka_GE/natia/medium/ka_GE-natia-medium.onnx",
      "artifactPath": "ka/ka_GE/natia/medium/ka_GE-natia-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "83bd40f8d176a83d3d8d605fada2a5e7",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY-SA 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-SA 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "de",
    "languageName": "German",
    "iso639_2": "deu",
    "bcp47": "de-DE",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:de_DE-thorsten-high",
      "languageCode": "de",
      "languageName": "German",
      "bcp47": "de-DE",
      "engine": "piper",
      "modelName": "de_DE-thorsten-high.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx",
      "artifactPath": "de/de_DE/thorsten/high/de_DE-thorsten-high.onnx",
      "checksumSha256": null,
      "checksumMd5": "256505fe58fb8b9d6ed78b83f6b8a9d2",
      "sizeBytes": 113895201,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:de_DE-eva_k-x_low",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-eva_k-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/eva_k/x_low/de_DE-eva_k-x_low.onnx",
        "artifactPath": "de/de_DE/eva_k/x_low/de_DE-eva_k-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "51bfc52a58282c2e4fc01ae66567a708",
        "sizeBytes": 20628813,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:de_DE-karlsson-low",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-karlsson-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/karlsson/low/de_DE-karlsson-low.onnx",
        "artifactPath": "de/de_DE/karlsson/low/de_DE-karlsson-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "c94b5b8e8c7147b4b2c4a19ca5a3c41b",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:de_DE-kerstin-low",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-kerstin-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/kerstin/low/de_DE-kerstin-low.onnx",
        "artifactPath": "de/de_DE/kerstin/low/de_DE-kerstin-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "1d5e5788cfddb04cbb34418f2841931e",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:de_DE-mls-medium",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-mls-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/mls/medium/de_DE-mls-medium.onnx",
        "artifactPath": "de/de_DE/mls/medium/de_DE-mls-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "bb543a8e82b95993cdd2199a0049623b",
        "sizeBytes": 76961079,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:de_DE-pavoque-low",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-pavoque-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/pavoque/low/de_DE-pavoque-low.onnx",
        "artifactPath": "de/de_DE/pavoque/low/de_DE-pavoque-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "bc37dccbad87fd65c8501c412c0c31ca",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:de_DE-ramona-low",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-ramona-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/ramona/low/de_DE-ramona-low.onnx",
        "artifactPath": "de/de_DE/ramona/low/de_DE-ramona-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "b4aaf3673170a0d96519cdc992c23fda",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:de_DE-thorsten-low",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-thorsten-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/low/de_DE-thorsten-low.onnx",
        "artifactPath": "de/de_DE/thorsten/low/de_DE-thorsten-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "c06eb96aceb61895fcb09ffc30eef60b",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:de_DE-thorsten-medium",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-thorsten-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx",
        "artifactPath": "de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "a129b00fb3078df43c96bab6c94535c0",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:de_DE-thorsten_emotional-medium",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "piper",
        "modelName": "de_DE-thorsten_emotional-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten_emotional/medium/de_DE-thorsten_emotional-medium.onnx",
        "artifactPath": "de/de_DE/thorsten_emotional/medium/de_DE-thorsten_emotional-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "7cc67d24d9d0b34d7a4f6224d16236b9",
        "sizeBytes": 76745905,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-deu",
        "languageCode": "de",
        "languageName": "German",
        "bcp47": "de-DE",
        "engine": "mms",
        "modelName": "facebook/mms-tts-deu",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-deu",
        "artifactPath": "models/mms/facebook_mms-tts-deu",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "el",
    "languageName": "Greek",
    "iso639_2": "ell",
    "bcp47": "el-GR",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:el_GR-rapunzelina-low",
      "languageCode": "el",
      "languageName": "Greek",
      "bcp47": "el-GR",
      "engine": "piper",
      "modelName": "el_GR-rapunzelina-low.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/el/el_GR/rapunzelina/low/el_GR-rapunzelina-low.onnx",
      "artifactPath": "el/el_GR/rapunzelina/low/el_GR-rapunzelina-low.onnx",
      "checksumSha256": null,
      "checksumMd5": "04e0151b653bb64540b1cde027054140",
      "sizeBytes": 63104526,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "isFinetuned": true,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:el_GR-joy-medium",
        "languageCode": "el",
        "languageName": "Greek",
        "bcp47": "el-GR",
        "engine": "piper",
        "modelName": "el_GR-joy-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/el/el_GR/joy/medium/el_GR-joy-medium.onnx",
        "artifactPath": "el/el_GR/joy/medium/el_GR-joy-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "080895960699531c30e70415a75a604d",
        "sizeBytes": 63516050,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Fine-tuned acoustic model",
        "isFinetuned": true,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:el_GR-rapunzelina-medium",
        "languageCode": "el",
        "languageName": "Greek",
        "bcp47": "el-GR",
        "engine": "piper",
        "modelName": "el_GR-rapunzelina-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/el/el_GR/rapunzelina/medium/el_GR-rapunzelina-medium.onnx",
        "artifactPath": "el/el_GR/rapunzelina/medium/el_GR-rapunzelina-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "265f2f9be00aa5ce81abc1f022145e42",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Fine-tuned acoustic model",
        "isFinetuned": true,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-ell",
        "languageCode": "el",
        "languageName": "Greek",
        "bcp47": "el-GR",
        "engine": "mms",
        "modelName": "facebook/mms-tts-ell",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-ell",
        "artifactPath": "models/mms/facebook_mms-tts-ell",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "kl",
    "languageName": "Greenlandic",
    "iso639_2": "kal",
    "bcp47": "kl-GL",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "gu",
    "languageName": "Gujarati",
    "iso639_2": "guj",
    "bcp47": "gu-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-guj",
      "languageCode": "gu",
      "languageName": "Gujarati",
      "bcp47": "gu-IN",
      "engine": "mms",
      "modelName": "facebook/mms-tts-guj",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-guj",
      "artifactPath": "models/mms/facebook_mms-tts-guj",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ha",
    "languageName": "Hausa",
    "iso639_2": "hau",
    "bcp47": "ha-NG",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-hau",
      "languageCode": "ha",
      "languageName": "Hausa",
      "bcp47": "ha-NG",
      "engine": "mms",
      "modelName": "facebook/mms-tts-hau",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-hau",
      "artifactPath": "models/mms/facebook_mms-tts-hau",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "haw",
    "languageName": "Hawaiian",
    "iso639_2": "haw",
    "bcp47": "haw-US",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "he",
    "languageName": "Hebrew",
    "iso639_2": "heb",
    "bcp47": "he-IL",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:he_IL-saspeech-medium",
      "languageCode": "he",
      "languageName": "Hebrew",
      "bcp47": "he-IL",
      "engine": "piper",
      "modelName": "he_IL-saspeech-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/he/he_IL/saspeech/medium/he_IL-saspeech-medium.onnx",
      "artifactPath": "he/he_IL/saspeech/medium/he_IL-saspeech-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "ffa7fbbbbeab5fa8fb7eb00bf9a0e2a5",
      "sizeBytes": 63221984,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-heb",
        "languageCode": "he",
        "languageName": "Hebrew",
        "bcp47": "he-IL",
        "engine": "mms",
        "modelName": "facebook/mms-tts-heb",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-heb",
        "artifactPath": "models/mms/facebook_mms-tts-heb",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "hi",
    "languageName": "Hindi",
    "iso639_2": "hin",
    "bcp47": "hi-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "kokoro",
    "canonicalModel": {
      "modelId": "kokoro:hf_alpha",
      "languageCode": "hi",
      "languageName": "Hindi",
      "bcp47": "hi-IN",
      "engine": "kokoro",
      "modelName": "Kokoro-82M",
      "modelType": "onnx-kokoro",
      "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
      "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": 86200000,
      "sampleRate": 24000,
      "voiceGenders": [
        "female",
        "male"
      ],
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:hi_IN-pratham-medium",
        "languageCode": "hi",
        "languageName": "Hindi",
        "bcp47": "hi-IN",
        "engine": "piper",
        "modelName": "hi_IN-pratham-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx",
        "artifactPath": "hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "f1e5a629a9e533a7155910530109eb86",
        "sizeBytes": 63516050,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:hi_IN-priyamvada-medium",
        "languageCode": "hi",
        "languageName": "Hindi",
        "bcp47": "hi-IN",
        "engine": "piper",
        "modelName": "hi_IN-priyamvada-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx",
        "artifactPath": "hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "7d5e20c2d1e72de8ed772f222e679626",
        "sizeBytes": 63516050,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:hi_IN-rohan-medium",
        "languageCode": "hi",
        "languageName": "Hindi",
        "bcp47": "hi-IN",
        "engine": "piper",
        "modelName": "hi_IN-rohan-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/rohan/medium/hi_IN-rohan-medium.onnx",
        "artifactPath": "hi/hi_IN/rohan/medium/hi_IN-rohan-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "d63d31559a4ccce62be938ab252a4804",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-hin",
        "languageCode": "hi",
        "languageName": "Hindi",
        "bcp47": "hi-IN",
        "engine": "mms",
        "modelName": "facebook/mms-tts-hin",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-hin",
        "artifactPath": "models/mms/facebook_mms-tts-hin",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "hu",
    "languageName": "Hungarian",
    "iso639_2": "hun",
    "bcp47": "hu-HU",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:hu_HU-anna-medium",
      "languageCode": "hu",
      "languageName": "Hungarian",
      "bcp47": "hu-HU",
      "engine": "piper",
      "modelName": "hu_HU-anna-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hu/hu_HU/anna/medium/hu_HU-anna-medium.onnx",
      "artifactPath": "hu/hu_HU/anna/medium/hu_HU-anna-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "3796f9fa28bd8d390d17828e2e2e952d",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:hu_HU-berta-medium",
        "languageCode": "hu",
        "languageName": "Hungarian",
        "bcp47": "hu-HU",
        "engine": "piper",
        "modelName": "hu_HU-berta-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hu/hu_HU/berta/medium/hu_HU-berta-medium.onnx",
        "artifactPath": "hu/hu_HU/berta/medium/hu_HU-berta-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "a94cc2562ba892f462cb502f9d3c3ca3",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:hu_HU-imre-medium",
        "languageCode": "hu",
        "languageName": "Hungarian",
        "bcp47": "hu-HU",
        "engine": "piper",
        "modelName": "hu_HU-imre-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hu/hu_HU/imre/medium/hu_HU-imre-medium.onnx",
        "artifactPath": "hu/hu_HU/imre/medium/hu_HU-imre-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "aa0b1d1fdd539881c64ed249097e75ff",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-hun",
        "languageCode": "hu",
        "languageName": "Hungarian",
        "bcp47": "hu-HU",
        "engine": "mms",
        "modelName": "facebook/mms-tts-hun",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-hun",
        "artifactPath": "models/mms/facebook_mms-tts-hun",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "is",
    "languageName": "Icelandic",
    "iso639_2": "isl",
    "bcp47": "is-IS",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:is_IS-ugla-medium",
      "languageCode": "is",
      "languageName": "Icelandic",
      "bcp47": "is-IS",
      "engine": "piper",
      "modelName": "is_IS-ugla-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/is/is_IS/ugla/medium/is_IS-ugla-medium.onnx",
      "artifactPath": "is/is_IS/ugla/medium/is_IS-ugla-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "722fcea3546f0113ad6664290aa97cab",
      "sizeBytes": 76495465,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:is_IS-bui-medium",
        "languageCode": "is",
        "languageName": "Icelandic",
        "bcp47": "is-IS",
        "engine": "piper",
        "modelName": "is_IS-bui-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/is/is_IS/bui/medium/is_IS-bui-medium.onnx",
        "artifactPath": "is/is_IS/bui/medium/is_IS-bui-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "08332bb41a67b52a3361bd1e8e36fb10",
        "sizeBytes": 76495465,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:is_IS-salka-medium",
        "languageCode": "is",
        "languageName": "Icelandic",
        "bcp47": "is-IS",
        "engine": "piper",
        "modelName": "is_IS-salka-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/is/is_IS/salka/medium/is_IS-salka-medium.onnx",
        "artifactPath": "is/is_IS/salka/medium/is_IS-salka-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "5967c9456b931d6123687d7b78fd81a7",
        "sizeBytes": 76495465,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:is_IS-steinn-medium",
        "languageCode": "is",
        "languageName": "Icelandic",
        "bcp47": "is-IS",
        "engine": "piper",
        "modelName": "is_IS-steinn-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/is/is_IS/steinn/medium/is_IS-steinn-medium.onnx",
        "artifactPath": "is/is_IS/steinn/medium/is_IS-steinn-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "fd8189eb0a72e78d525e70a71aaa792c",
        "sizeBytes": 76495465,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-isl",
        "languageCode": "is",
        "languageName": "Icelandic",
        "bcp47": "is-IS",
        "engine": "mms",
        "modelName": "facebook/mms-tts-isl",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-isl",
        "artifactPath": "models/mms/facebook_mms-tts-isl",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ig",
    "languageName": "Igbo",
    "iso639_2": "ibo",
    "bcp47": "ig-NG",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "id",
    "languageName": "Indonesian",
    "iso639_2": "ind",
    "bcp47": "id-ID",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:id_ID-news_tts-medium",
      "languageCode": "id",
      "languageName": "Indonesian",
      "bcp47": "id-ID",
      "engine": "piper",
      "modelName": "id_ID-news_tts-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/news_tts/medium/id_ID-news_tts-medium.onnx",
      "artifactPath": "id/id_ID/news_tts/medium/id_ID-news_tts-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "17de01db7ac654655436b6e509893c72",
      "sizeBytes": 62950044,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-ind",
        "languageCode": "id",
        "languageName": "Indonesian",
        "bcp47": "id-ID",
        "engine": "mms",
        "modelName": "facebook/mms-tts-ind",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-ind",
        "artifactPath": "models/mms/facebook_mms-tts-ind",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ga",
    "languageName": "Irish",
    "iso639_2": "gle",
    "bcp47": "ga-IE",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "it",
    "languageName": "Italian",
    "iso639_2": "ita",
    "bcp47": "it-IT",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "kokoro",
    "canonicalModel": {
      "modelId": "kokoro:it_IT-riccardo",
      "languageCode": "it",
      "languageName": "Italian",
      "bcp47": "it-IT",
      "engine": "kokoro",
      "modelName": "Kokoro-82M",
      "modelType": "onnx-kokoro",
      "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
      "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": 86200000,
      "sampleRate": 24000,
      "voiceGenders": [
        "male",
        "female"
      ],
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:it_IT-paola-medium",
        "languageCode": "it",
        "languageName": "Italian",
        "bcp47": "it-IT",
        "engine": "piper",
        "modelName": "it_IT-paola-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/paola/medium/it_IT-paola-medium.onnx",
        "artifactPath": "it/it_IT/paola/medium/it_IT-paola-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "3a44e73b12ca5d0c21a72e388b5847c8",
        "sizeBytes": 63511038,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY-SA",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:it_IT-riccardo-x_low",
        "languageCode": "it",
        "languageName": "Italian",
        "bcp47": "it-IT",
        "engine": "piper",
        "modelName": "it_IT-riccardo-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/riccardo/x_low/it_IT-riccardo-x_low.onnx",
        "artifactPath": "it/it_IT/riccardo/x_low/it_IT-riccardo-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "2c564b67f6bfaf3ad02d28ab528929b8",
        "sizeBytes": 28130791,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY-SA",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:it_IT-serena-high",
        "languageCode": "it",
        "languageName": "Italian",
        "bcp47": "it-IT",
        "engine": "piper",
        "modelName": "it_IT-serena-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/serena/high/it_IT-serena-high.onnx",
        "artifactPath": "it/it_IT/serena/high/it_IT-serena-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "0b4d9553883e439fd7bda5475e820bfe",
        "sizeBytes": 114204024,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY-SA",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:it_IT-serena-medium",
        "languageCode": "it",
        "languageName": "Italian",
        "bcp47": "it-IT",
        "engine": "piper",
        "modelName": "it_IT-serena-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/serena/medium/it_IT-serena-medium.onnx",
        "artifactPath": "it/it_IT/serena/medium/it_IT-serena-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "f8c82f1139dfa382686bd7564a633400",
        "sizeBytes": 63516051,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY-SA",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ja",
    "languageName": "Japanese",
    "iso639_2": "jpn",
    "bcp47": "ja-JP",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "kokoro",
    "canonicalModel": {
      "modelId": "kokoro:jf_alpha",
      "languageCode": "ja",
      "languageName": "Japanese",
      "bcp47": "ja-JP",
      "engine": "kokoro",
      "modelName": "Kokoro-82M",
      "modelType": "onnx-kokoro",
      "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
      "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": 86200000,
      "sampleRate": 24000,
      "voiceGenders": [
        "female",
        "male"
      ],
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:ja_JP-hi_fi_captain-medium",
        "languageCode": "ja",
        "languageName": "Japanese",
        "bcp47": "ja-JP",
        "engine": "piper",
        "modelName": "ja_JP-hi_fi_captain-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ja/ja_JP/hi_fi_captain/medium/ja_JP-hi_fi_captain-medium.onnx",
        "artifactPath": "ja/ja_JP/hi_fi_captain/medium/ja_JP-hi_fi_captain-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "f9daab8970d06d7e9fc895a879854542",
        "sizeBytes": 76753841,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "jv",
    "languageName": "Javanese",
    "iso639_2": "jav",
    "bcp47": "jv-ID",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-jav",
      "languageCode": "jv",
      "languageName": "Javanese",
      "bcp47": "jv-ID",
      "engine": "mms",
      "modelName": "facebook/mms-tts-jav",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-jav",
      "artifactPath": "models/mms/facebook_mms-tts-jav",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "kn",
    "languageName": "Kannada",
    "iso639_2": "kan",
    "bcp47": "kn-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-kan",
      "languageCode": "kn",
      "languageName": "Kannada",
      "bcp47": "kn-IN",
      "engine": "mms",
      "modelName": "facebook/mms-tts-kan",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-kan",
      "artifactPath": "models/mms/facebook_mms-tts-kan",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ks",
    "languageName": "Kashmiri",
    "iso639_2": "kas",
    "bcp47": "ks-IN",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "kk",
    "languageName": "Kazakh",
    "iso639_2": "kaz",
    "bcp47": "kk-KZ",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:kk_KZ-issai-high",
      "languageCode": "kk",
      "languageName": "Kazakh",
      "bcp47": "kk-KZ",
      "engine": "piper",
      "modelName": "kk_KZ-issai-high.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/issai/high/kk_KZ-issai-high.onnx",
      "artifactPath": "kk/kk_KZ/issai/high/kk_KZ-issai-high.onnx",
      "checksumSha256": null,
      "checksumMd5": "d5a97c25feb0949c187ae5f8e72753e3",
      "sizeBytes": 127864258,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:kk_KZ-iseke-x_low",
        "languageCode": "kk",
        "languageName": "Kazakh",
        "bcp47": "kk-KZ",
        "engine": "piper",
        "modelName": "kk_KZ-iseke-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/iseke/x_low/kk_KZ-iseke-x_low.onnx",
        "artifactPath": "kk/kk_KZ/iseke/x_low/kk_KZ-iseke-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "1674f3f4ce48981d77e500741afa4ff9",
        "sizeBytes": 28130791,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:kk_KZ-raya-x_low",
        "languageCode": "kk",
        "languageName": "Kazakh",
        "bcp47": "kk-KZ",
        "engine": "piper",
        "modelName": "kk_KZ-raya-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/raya/x_low/kk_KZ-raya-x_low.onnx",
        "artifactPath": "kk/kk_KZ/raya/x_low/kk_KZ-raya-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "476ecc32e07cad26572a50f26d0ebe28",
        "sizeBytes": 28130791,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-kaz",
        "languageCode": "kk",
        "languageName": "Kazakh",
        "bcp47": "kk-KZ",
        "engine": "mms",
        "modelName": "facebook/mms-tts-kaz",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-kaz",
        "artifactPath": "models/mms/facebook_mms-tts-kaz",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "km",
    "languageName": "Khmer",
    "iso639_2": "khm",
    "bcp47": "km-KH",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-khm",
      "languageCode": "km",
      "languageName": "Khmer",
      "bcp47": "km-KH",
      "engine": "mms",
      "modelName": "facebook/mms-tts-khm",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-khm",
      "artifactPath": "models/mms/facebook_mms-tts-khm",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "rw",
    "languageName": "Kinyarwanda",
    "iso639_2": "kin",
    "bcp47": "rw-RW",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-kin",
      "languageCode": "rw",
      "languageName": "Kinyarwanda",
      "bcp47": "rw-RW",
      "engine": "mms",
      "modelName": "facebook/mms-tts-kin",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-kin",
      "artifactPath": "models/mms/facebook_mms-tts-kin",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "kok",
    "languageName": "Konkani",
    "iso639_2": "kok",
    "bcp47": "kok-IN",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ko",
    "languageName": "Korean",
    "iso639_2": "kor",
    "bcp47": "ko-KR",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ko_KR-kss-medium",
      "languageCode": "ko",
      "languageName": "Korean",
      "bcp47": "ko-KR",
      "engine": "piper",
      "modelName": "ko_KR-kss-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx",
      "artifactPath": "ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "bebbd298dffe5ee7b88f2ce41bb4e3a9",
      "sizeBytes": 63221984,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-kor",
        "languageCode": "ko",
        "languageName": "Korean",
        "bcp47": "ko-KR",
        "engine": "mms",
        "modelName": "facebook/mms-tts-kor",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-kor",
        "artifactPath": "models/mms/facebook_mms-tts-kor",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ku",
    "languageName": "Kurdish",
    "iso639_2": "kur",
    "bcp47": "ku-TR",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ku_TR-berfin_renas-medium",
      "languageCode": "ku",
      "languageName": "Kurdish",
      "bcp47": "ku-TR",
      "engine": "piper",
      "modelName": "ku_TR-berfin_renas-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ku/ku_TR/berfin_renas/medium/ku_TR-berfin_renas-medium.onnx",
      "artifactPath": "ku/ku_TR/berfin_renas/medium/ku_TR-berfin_renas-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "49f32b10c6f577b3dc3f179cac4947b5",
      "sizeBytes": 77060307,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ky",
    "languageName": "Kyrgyz",
    "iso639_2": "kir",
    "bcp47": "ky-KG",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-kir",
      "languageCode": "ky",
      "languageName": "Kyrgyz",
      "bcp47": "ky-KG",
      "engine": "mms",
      "modelName": "facebook/mms-tts-kir",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-kir",
      "artifactPath": "models/mms/facebook_mms-tts-kir",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "lo",
    "languageName": "Lao",
    "iso639_2": "lao",
    "bcp47": "lo-LA",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-lao",
      "languageCode": "lo",
      "languageName": "Lao",
      "bcp47": "lo-LA",
      "engine": "mms",
      "modelName": "facebook/mms-tts-lao",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-lao",
      "artifactPath": "models/mms/facebook_mms-tts-lao",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "lv",
    "languageName": "Latvian",
    "iso639_2": "lav",
    "bcp47": "lv-LV",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:lv_LV-aivars-medium",
      "languageCode": "lv",
      "languageName": "Latvian",
      "bcp47": "lv-LV",
      "engine": "piper",
      "modelName": "lv_LV-aivars-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/lv/lv_LV/aivars/medium/lv_LV-aivars-medium.onnx",
      "artifactPath": "lv/lv_LV/aivars/medium/lv_LV-aivars-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "5b48c6f958aea5b7e9ff34f6a10882dd",
      "sizeBytes": 63511038,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-lav",
        "languageCode": "lv",
        "languageName": "Latvian",
        "bcp47": "lv-LV",
        "engine": "mms",
        "modelName": "facebook/mms-tts-lav",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-lav",
        "artifactPath": "models/mms/facebook_mms-tts-lav",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "lt",
    "languageName": "Lithuanian",
    "iso639_2": "lit",
    "bcp47": "lt-LT",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:lt_LT-reginute1-medium",
      "languageCode": "lt",
      "languageName": "Lithuanian",
      "bcp47": "lt-LT",
      "engine": "piper",
      "modelName": "lt_LT-reginute1-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/lt/lt_LT/reginute1/medium/lt_LT-reginute1-medium.onnx",
      "artifactPath": "lt/lt_LT/reginute1/medium/lt_LT-reginute1-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "315dabbe13d83276cb5f921119d87dac",
      "sizeBytes": 63516051,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "lb",
    "languageName": "Luxembourgish",
    "iso639_2": "ltz",
    "bcp47": "lb-LU",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:lb_LU-marylux-medium",
      "languageCode": "lb",
      "languageName": "Luxembourgish",
      "bcp47": "lb-LU",
      "engine": "piper",
      "modelName": "lb_LU-marylux-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/lb/lb_LU/marylux/medium/lb_LU-marylux-medium.onnx",
      "artifactPath": "lb/lb_LU/marylux/medium/lb_LU-marylux-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "966856e665a46cee45cb0cd2c475f8d5",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "mk",
    "languageName": "Macedonian",
    "iso639_2": "mkd",
    "bcp47": "mk-MK",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "mai",
    "languageName": "Maithili",
    "iso639_2": "mai",
    "bcp47": "mai-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-mai",
      "languageCode": "mai",
      "languageName": "Maithili",
      "bcp47": "mai-IN",
      "engine": "mms",
      "modelName": "facebook/mms-tts-mai",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-mai",
      "artifactPath": "models/mms/facebook_mms-tts-mai",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "mg",
    "languageName": "Malagasy",
    "iso639_2": "mlg",
    "bcp47": "mg-MG",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-mlg",
      "languageCode": "mg",
      "languageName": "Malagasy",
      "bcp47": "mg-MG",
      "engine": "mms",
      "modelName": "facebook/mms-tts-mlg",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-mlg",
      "artifactPath": "models/mms/facebook_mms-tts-mlg",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ms",
    "languageName": "Malay",
    "iso639_2": "msa",
    "bcp47": "ms-MY",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ml",
    "languageName": "Malayalam",
    "iso639_2": "mal",
    "bcp47": "ml-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ml_IN-arjun-medium",
      "languageCode": "ml",
      "languageName": "Malayalam",
      "bcp47": "ml-IN",
      "engine": "piper",
      "modelName": "ml_IN-arjun-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ml/ml_IN/arjun/medium/ml_IN-arjun-medium.onnx",
      "artifactPath": "ml/ml_IN/arjun/medium/ml_IN-arjun-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "4f20109c108aa80f46df85ab9cda5daa",
      "sizeBytes": 62950044,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:ml_IN-meera-medium",
        "languageCode": "ml",
        "languageName": "Malayalam",
        "bcp47": "ml-IN",
        "engine": "piper",
        "modelName": "ml_IN-meera-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ml/ml_IN/meera/medium/ml_IN-meera-medium.onnx",
        "artifactPath": "ml/ml_IN/meera/medium/ml_IN-meera-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "3eb7b05d25c1551f7a7cec1e1c153b1f",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Non-Commercial / Lessac Base",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-mal",
        "languageCode": "ml",
        "languageName": "Malayalam",
        "bcp47": "ml-IN",
        "engine": "mms",
        "modelName": "facebook/mms-tts-mal",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-mal",
        "artifactPath": "models/mms/facebook_mms-tts-mal",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "mt",
    "languageName": "Maltese",
    "iso639_2": "mlt",
    "bcp47": "mt-MT",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "mni",
    "languageName": "Manipuri",
    "iso639_2": "mni",
    "bcp47": "mni-IN",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "mi",
    "languageName": "Māori",
    "iso639_2": "mri",
    "bcp47": "mi-NZ",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "mr",
    "languageName": "Marathi",
    "iso639_2": "mar",
    "bcp47": "mr-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:mr_IN-google-medium",
      "languageCode": "mr",
      "languageName": "Marathi",
      "bcp47": "mr-IN",
      "engine": "piper",
      "modelName": "mr_IN-google-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/mr/mr_IN/google/medium/mr_IN-google-medium.onnx",
      "artifactPath": "mr/mr_IN/google/medium/mr_IN-google-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "331957abd31bff58aaa10934cd3ac58f",
      "sizeBytes": 76768179,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "CC-BY-SA 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "isFinetuned": true,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-mar",
        "languageCode": "mr",
        "languageName": "Marathi",
        "bcp47": "mr-IN",
        "engine": "mms",
        "modelName": "facebook/mms-tts-mar",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-mar",
        "artifactPath": "models/mms/facebook_mms-tts-mar",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-SA 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "mn",
    "languageName": "Mongolian",
    "iso639_2": "mon",
    "bcp47": "mn-MN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-mon",
      "languageCode": "mn",
      "languageName": "Mongolian",
      "bcp47": "mn-MN",
      "engine": "mms",
      "modelName": "facebook/mms-tts-mon",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-mon",
      "artifactPath": "models/mms/facebook_mms-tts-mon",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ne",
    "languageName": "Nepali",
    "iso639_2": "nep",
    "bcp47": "ne-NP",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ne_NP-google-medium",
      "languageCode": "ne",
      "languageName": "Nepali",
      "bcp47": "ne-NP",
      "engine": "piper",
      "modelName": "ne_NP-google-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ne/ne_NP/google/medium/ne_NP-google-medium.onnx",
      "artifactPath": "ne/ne_NP/google/medium/ne_NP-google-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "2c24ccfe18eca2f14bccd0a188516109",
      "sizeBytes": 76766385,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "CC-BY-SA 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:ne_NP-chitwan-medium",
        "languageCode": "ne",
        "languageName": "Nepali",
        "bcp47": "ne-NP",
        "engine": "piper",
        "modelName": "ne_NP-chitwan-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ne/ne_NP/chitwan/medium/ne_NP-chitwan-medium.onnx",
        "artifactPath": "ne/ne_NP/chitwan/medium/ne_NP-chitwan-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "74cdb5b32816c366af74b55ed7494e25",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY-SA 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:ne_NP-google-x_low",
        "languageCode": "ne",
        "languageName": "Nepali",
        "bcp47": "ne-NP",
        "engine": "piper",
        "modelName": "ne_NP-google-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx",
        "artifactPath": "ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "b11030daccc781a7db64c9413197ca8a",
        "sizeBytes": 27693157,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "CC-BY-SA 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-SA 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "no",
    "languageName": "Norwegian",
    "iso639_2": "nor",
    "bcp47": "no-NO",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:no_NO-nvcc-medium",
      "languageCode": "no",
      "languageName": "Norwegian",
      "bcp47": "no-NO",
      "engine": "piper",
      "modelName": "no_NO-nvcc-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/no/no_NO/nvcc/medium/no_NO-nvcc-medium.onnx",
      "artifactPath": "no/no_NO/nvcc/medium/no_NO-nvcc-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "67e04e52b2f195e6db3ae103b58d1710",
      "sizeBytes": 76770227,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:no_NO-talesyntese-medium",
        "languageCode": "no",
        "languageName": "Norwegian",
        "bcp47": "no-NO",
        "engine": "piper",
        "modelName": "no_NO-talesyntese-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/no/no_NO/talesyntese/medium/no_NO-talesyntese-medium.onnx",
        "artifactPath": "no/no_NO/talesyntese/medium/no_NO-talesyntese-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "9fc876e7edc6593086b4f2f34889f44b",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "or",
    "languageName": "Odia",
    "iso639_2": "ori",
    "bcp47": "or-IN",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "om",
    "languageName": "Oromo",
    "iso639_2": "orm",
    "bcp47": "om-ET",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-orm",
      "languageCode": "om",
      "languageName": "Oromo",
      "bcp47": "om-ET",
      "engine": "mms",
      "modelName": "facebook/mms-tts-orm",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-orm",
      "artifactPath": "models/mms/facebook_mms-tts-orm",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ps",
    "languageName": "Pashto",
    "iso639_2": "pus",
    "bcp47": "ps-AF",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "fa",
    "languageName": "Persian",
    "iso639_2": "fas",
    "bcp47": "fa-IR",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:fa_IR-amir-medium",
      "languageCode": "fa",
      "languageName": "Persian",
      "bcp47": "fa-IR",
      "engine": "piper",
      "modelName": "fa_IR-amir-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx",
      "artifactPath": "fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "7c0598c9726427869e1e86447b333539",
      "sizeBytes": 63531379,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:fa_IR-ganji-medium",
        "languageCode": "fa",
        "languageName": "Persian",
        "bcp47": "fa-IR",
        "engine": "piper",
        "modelName": "fa_IR-ganji-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/ganji/medium/fa_IR-ganji-medium.onnx",
        "artifactPath": "fa/fa_IR/ganji/medium/fa_IR-ganji-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "b50577af60b986135b37edaeaabb01b9",
        "sizeBytes": 63516050,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fa_IR-ganji_adabi-medium",
        "languageCode": "fa",
        "languageName": "Persian",
        "bcp47": "fa-IR",
        "engine": "piper",
        "modelName": "fa_IR-ganji_adabi-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/ganji_adabi/medium/fa_IR-ganji_adabi-medium.onnx",
        "artifactPath": "fa/fa_IR/ganji_adabi/medium/fa_IR-ganji_adabi-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "596844694672ac3d007c544301874553",
        "sizeBytes": 63516050,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fa_IR-gyro-medium",
        "languageCode": "fa",
        "languageName": "Persian",
        "bcp47": "fa-IR",
        "engine": "piper",
        "modelName": "fa_IR-gyro-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/gyro/medium/fa_IR-gyro-medium.onnx",
        "artifactPath": "fa/fa_IR/gyro/medium/fa_IR-gyro-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "e8ce094894c8ec2a77bfd0397b45d112",
        "sizeBytes": 63122309,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:fa_IR-reza_ibrahim-medium",
        "languageCode": "fa",
        "languageName": "Persian",
        "bcp47": "fa-IR",
        "engine": "piper",
        "modelName": "fa_IR-reza_ibrahim-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/reza_ibrahim/medium/fa_IR-reza_ibrahim-medium.onnx",
        "artifactPath": "fa/fa_IR/reza_ibrahim/medium/fa_IR-reza_ibrahim-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "b9d4059c794df8336060fb7f36264a43",
        "sizeBytes": 63511038,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-fas",
        "languageCode": "fa",
        "languageName": "Persian",
        "bcp47": "fa-IR",
        "engine": "mms",
        "modelName": "facebook/mms-tts-fas",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-fas",
        "artifactPath": "models/mms/facebook_mms-tts-fas",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "pl",
    "languageName": "Polish",
    "iso639_2": "pol",
    "bcp47": "pl-PL",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:pl_PL-darkman-medium",
      "languageCode": "pl",
      "languageName": "Polish",
      "bcp47": "pl-PL",
      "engine": "piper",
      "modelName": "pl_PL-darkman-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx",
      "artifactPath": "pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "27bf2d71e934b112657544fd0b100a7a",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:pl_PL-bass-high",
        "languageCode": "pl",
        "languageName": "Polish",
        "bcp47": "pl-PL",
        "engine": "piper",
        "modelName": "pl_PL-bass-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/bass/high/pl_PL-bass-high.onnx",
        "artifactPath": "pl/pl_PL/bass/high/pl_PL-bass-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "427c7c0975ee21cea29db0f58f827883",
        "sizeBytes": 114204024,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:pl_PL-gosia-medium",
        "languageCode": "pl",
        "languageName": "Polish",
        "bcp47": "pl-PL",
        "engine": "piper",
        "modelName": "pl_PL-gosia-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx",
        "artifactPath": "pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "ecf817530e575025166e454adde1f382",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:pl_PL-mc_speech-medium",
        "languageCode": "pl",
        "languageName": "Polish",
        "bcp47": "pl-PL",
        "engine": "piper",
        "modelName": "pl_PL-mc_speech-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/mc_speech/medium/pl_PL-mc_speech-medium.onnx",
        "artifactPath": "pl/pl_PL/mc_speech/medium/pl_PL-mc_speech-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "a927e2f2c882bb40cbc2e5f3356ce19b",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:pl_PL-mls_6892-low",
        "languageCode": "pl",
        "languageName": "Polish",
        "bcp47": "pl-PL",
        "engine": "piper",
        "modelName": "pl_PL-mls_6892-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/mls_6892/low/pl_PL-mls_6892-low.onnx",
        "artifactPath": "pl/pl_PL/mls_6892/low/pl_PL-mls_6892-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "8590d8e979292ca35d20e6e123bfa612",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-pol",
        "languageCode": "pl",
        "languageName": "Polish",
        "bcp47": "pl-PL",
        "engine": "mms",
        "modelName": "facebook/mms-tts-pol",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-pol",
        "artifactPath": "models/mms/facebook_mms-tts-pol",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "pt",
    "languageName": "Portuguese",
    "iso639_2": "por",
    "bcp47": "pt-PT",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "kokoro",
    "canonicalModel": {
      "modelId": "kokoro:pt_BR-edresson",
      "languageCode": "pt",
      "languageName": "Portuguese",
      "bcp47": "pt-BR",
      "engine": "kokoro",
      "modelName": "Kokoro-82M",
      "modelType": "onnx-kokoro",
      "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
      "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": 86200000,
      "sampleRate": 24000,
      "voiceGenders": [
        "female",
        "male"
      ],
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:pt_BR-cadu-medium",
        "languageCode": "pt",
        "languageName": "Portuguese",
        "bcp47": "pt-BR",
        "engine": "piper",
        "modelName": "pt_BR-cadu-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/cadu/medium/pt_BR-cadu-medium.onnx",
        "artifactPath": "pt/pt_BR/cadu/medium/pt_BR-cadu-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "6f3a6e23694c9088e3696a15191af2cc",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:pt_BR-edresson-low",
        "languageCode": "pt",
        "languageName": "Portuguese",
        "bcp47": "pt-BR",
        "engine": "piper",
        "modelName": "pt_BR-edresson-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/edresson/low/pt_BR-edresson-low.onnx",
        "artifactPath": "pt/pt_BR/edresson/low/pt_BR-edresson-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "53e365c040dd07890fe1855b64c7cc58",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:pt_BR-faber-medium",
        "languageCode": "pt",
        "languageName": "Portuguese",
        "bcp47": "pt-BR",
        "engine": "piper",
        "modelName": "pt_BR-faber-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx",
        "artifactPath": "pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "e0724a2f07965f6523d2a1e96b488a4c",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:pt_BR-jeff-medium",
        "languageCode": "pt",
        "languageName": "Portuguese",
        "bcp47": "pt-BR",
        "engine": "piper",
        "modelName": "pt_BR-jeff-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/jeff/medium/pt_BR-jeff-medium.onnx",
        "artifactPath": "pt/pt_BR/jeff/medium/pt_BR-jeff-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "dfb93e9da48638f9efa6b63fdb0b7030",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:pt_PT-tugão-medium",
        "languageCode": "pt",
        "languageName": "Portuguese",
        "bcp47": "pt-PT",
        "engine": "piper",
        "modelName": "pt_PT-tugão-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_PT/tugão/medium/pt_PT-tugão-medium.onnx",
        "artifactPath": "pt/pt_PT/tugão/medium/pt_PT-tugão-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "0642048511ffe36c3b519520614b53f4",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC-BY",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-por",
        "languageCode": "pt",
        "languageName": "Portuguese",
        "bcp47": "pt-PT",
        "engine": "mms",
        "modelName": "facebook/mms-tts-por",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-por",
        "artifactPath": "models/mms/facebook_mms-tts-por",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "pa",
    "languageName": "Punjabi",
    "iso639_2": "pan",
    "bcp47": "pa-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-pan",
      "languageCode": "pa",
      "languageName": "Punjabi",
      "bcp47": "pa-IN",
      "engine": "mms",
      "modelName": "facebook/mms-tts-pan",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-pan",
      "artifactPath": "models/mms/facebook_mms-tts-pan",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ro",
    "languageName": "Romanian",
    "iso639_2": "ron",
    "bcp47": "ro-RO",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ro_RO-mihai-medium",
      "languageCode": "ro",
      "languageName": "Romanian",
      "bcp47": "ro-RO",
      "engine": "piper",
      "modelName": "ro_RO-mihai-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ro/ro_RO/mihai/medium/ro_RO-mihai-medium.onnx",
      "artifactPath": "ro/ro_RO/mihai/medium/ro_RO-mihai-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "45f4253916c93d3d05ad3fe1b07ea4f3",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-ron",
        "languageCode": "ro",
        "languageName": "Romanian",
        "bcp47": "ro-RO",
        "engine": "mms",
        "modelName": "facebook/mms-tts-ron",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-ron",
        "artifactPath": "models/mms/facebook_mms-tts-ron",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ru",
    "languageName": "Russian",
    "iso639_2": "rus",
    "bcp47": "ru-RU",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ru_RU-dmitri-medium",
      "languageCode": "ru",
      "languageName": "Russian",
      "bcp47": "ru-RU",
      "engine": "piper",
      "modelName": "ru_RU-dmitri-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx",
      "artifactPath": "ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "589ccc91745a1e2353508ff62c5941b7",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:ru_RU-denis-medium",
        "languageCode": "ru",
        "languageName": "Russian",
        "bcp47": "ru-RU",
        "engine": "piper",
        "modelName": "ru_RU-denis-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/denis/medium/ru_RU-denis-medium.onnx",
        "artifactPath": "ru/ru_RU/denis/medium/ru_RU-denis-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "76c2f14e521fef3ed574f97ad492728e",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:ru_RU-irina-medium",
        "languageCode": "ru",
        "languageName": "Russian",
        "bcp47": "ru-RU",
        "engine": "piper",
        "modelName": "ru_RU-irina-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx",
        "artifactPath": "ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "21fbe77fdc68bdc35d7adb6bf4f52199",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:ru_RU-ruslan-medium",
        "languageCode": "ru",
        "languageName": "Russian",
        "bcp47": "ru-RU",
        "engine": "piper",
        "modelName": "ru_RU-ruslan-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx",
        "artifactPath": "ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "731eb188e63b4c57320e38047ba2d850",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-rus",
        "languageCode": "ru",
        "languageName": "Russian",
        "bcp47": "ru-RU",
        "engine": "mms",
        "modelName": "facebook/mms-tts-rus",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-rus",
        "artifactPath": "models/mms/facebook_mms-tts-rus",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sm",
    "languageName": "Samoan",
    "iso639_2": "smo",
    "bcp47": "sm-WS",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-smo",
      "languageCode": "sm",
      "languageName": "Samoan",
      "bcp47": "sm-WS",
      "engine": "mms",
      "modelName": "facebook/mms-tts-smo",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-smo",
      "artifactPath": "models/mms/facebook_mms-tts-smo",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sa",
    "languageName": "Sanskrit",
    "iso639_2": "san",
    "bcp47": "sa-IN",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sat",
    "languageName": "Santali",
    "iso639_2": "sat",
    "bcp47": "sat-IN",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sr",
    "languageName": "Serbian",
    "iso639_2": "srp",
    "bcp47": "sr-RS",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:sr_RS-serbski_institut-medium",
      "languageCode": "sr",
      "languageName": "Serbian",
      "bcp47": "sr-RS",
      "engine": "piper",
      "modelName": "sr_RS-serbski_institut-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sr/sr_RS/serbski_institut/medium/sr_RS-serbski_institut-medium.onnx",
      "artifactPath": "sr/sr_RS/serbski_institut/medium/sr_RS-serbski_institut-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "02c6e27ac7b4dfa84272df89edca9feb",
      "sizeBytes": 76733615,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sd",
    "languageName": "Sindhi",
    "iso639_2": "snd",
    "bcp47": "sd-IN",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "si",
    "languageName": "Sinhala",
    "iso639_2": "sin",
    "bcp47": "si-LK",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sk",
    "languageName": "Slovak",
    "iso639_2": "slk",
    "bcp47": "sk-SK",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:sk_SK-lili-medium",
      "languageCode": "sk",
      "languageName": "Slovak",
      "bcp47": "sk-SK",
      "engine": "piper",
      "modelName": "sk_SK-lili-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sk/sk_SK/lili/medium/sk_SK-lili-medium.onnx",
      "artifactPath": "sk/sk_SK/lili/medium/sk_SK-lili-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "836e078518042448bda8416a8ea52984",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sl",
    "languageName": "Slovenian",
    "iso639_2": "slv",
    "bcp47": "sl-SI",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:sl_SI-artur-medium",
      "languageCode": "sl",
      "languageName": "Slovenian",
      "bcp47": "sl-SI",
      "engine": "piper",
      "modelName": "sl_SI-artur-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sl/sl_SI/artur/medium/sl_SI-artur-medium.onnx",
      "artifactPath": "sl/sl_SI/artur/medium/sl_SI-artur-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "ca0aac61139e446bebf98561e8cf9407",
      "sizeBytes": 63200492,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "so",
    "languageName": "Somali",
    "iso639_2": "som",
    "bcp47": "so-SO",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-som",
      "languageCode": "so",
      "languageName": "Somali",
      "bcp47": "so-SO",
      "engine": "mms",
      "modelName": "facebook/mms-tts-som",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-som",
      "artifactPath": "models/mms/facebook_mms-tts-som",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "es",
    "languageName": "Spanish",
    "iso639_2": "spa",
    "bcp47": "es-ES",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "kokoro",
    "canonicalModel": {
      "modelId": "kokoro:es_ES-carlfm",
      "languageCode": "es",
      "languageName": "Spanish",
      "bcp47": "es-ES",
      "engine": "kokoro",
      "modelName": "Kokoro-82M",
      "modelType": "onnx-kokoro",
      "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
      "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": 86200000,
      "sampleRate": 24000,
      "voiceGenders": [
        "male",
        "female"
      ],
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:es_AR-daniela-high",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-AR",
        "engine": "piper",
        "modelName": "es_AR-daniela-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx",
        "artifactPath": "es/es_AR/daniela/high/es_AR-daniela-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "e373fb657c93877dbc438badeadff4cb",
        "sizeBytes": 114199011,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:es_ES-carlfm-x_low",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-ES",
        "engine": "piper",
        "modelName": "es_ES-carlfm-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx",
        "artifactPath": "es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "4137b5aee01ea6241080fc4dbe59a8ee",
        "sizeBytes": 28130791,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:es_ES-davefx-medium",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-ES",
        "engine": "piper",
        "modelName": "es_ES-davefx-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx",
        "artifactPath": "es/es_ES/davefx/medium/es_ES-davefx-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "dc515cd4ecc5f6f72fe14a941188fc9c",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:es_ES-mls_10246-low",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-ES",
        "engine": "piper",
        "modelName": "es_ES-mls_10246-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx",
        "artifactPath": "es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "ab8e93c9d2714fd4481fbca4e2a38891",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:es_ES-mls_9972-low",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-ES",
        "engine": "piper",
        "modelName": "es_ES-mls_9972-low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_9972/low/es_ES-mls_9972-low.onnx",
        "artifactPath": "es/es_ES/mls_9972/low/es_ES-mls_9972-low.onnx",
        "checksumSha256": null,
        "checksumMd5": "587f2fc38dc3f582e771c3748465e2a2",
        "sizeBytes": 63104526,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:es_ES-sharvard-medium",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-ES",
        "engine": "piper",
        "modelName": "es_ES-sharvard-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx",
        "artifactPath": "es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "77e6f9c26e92799fb04bb90b46bf1834",
        "sizeBytes": 76733615,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:es_MX-ald-medium",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-MX",
        "engine": "piper",
        "modelName": "es_MX-ald-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/ald/medium/es_MX-ald-medium.onnx",
        "artifactPath": "es/es_MX/ald/medium/es_MX-ald-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "86374058e59b41ac3b7fe4181e1daad6",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:es_MX-ald-x_low",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-MX",
        "engine": "piper",
        "modelName": "es_MX-ald-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/ald/x_low/es_MX-ald-x_low.onnx",
        "artifactPath": "es/es_MX/ald/x_low/es_MX-ald-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "b463f8c0972f28f89494961137cd2dc1",
        "sizeBytes": 20986952,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:es_MX-claude-high",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-MX",
        "engine": "piper",
        "modelName": "es_MX-claude-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high/es_MX-claude-high.onnx",
        "artifactPath": "es/es_MX/claude/high/es_MX-claude-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "cb1966e0ff20ca3aa010f6c9a0ce296a",
        "sizeBytes": 63122309,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "Apache 2.0 / CC0",
        "datasetLicense": "Research / Community Dataset",
        "baseLineage": "Direct acoustic training",
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-spa",
        "languageCode": "es",
        "languageName": "Spanish",
        "bcp47": "es-ES",
        "engine": "mms",
        "modelName": "facebook/mms-tts-spa",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-spa",
        "artifactPath": "models/mms/facebook_mms-tts-spa",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Apache-2.0",
      "datasetLicense": "Permissive community dataset",
      "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "su",
    "languageName": "Sundanese",
    "iso639_2": "sun",
    "bcp47": "su-ID",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-sun",
      "languageCode": "su",
      "languageName": "Sundanese",
      "bcp47": "su-ID",
      "engine": "mms",
      "modelName": "facebook/mms-tts-sun",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-sun",
      "artifactPath": "models/mms/facebook_mms-tts-sun",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sw",
    "languageName": "Swahili",
    "iso639_2": "swa",
    "bcp47": "sw-KE",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:sw_CD-lanfrica-medium",
      "languageCode": "sw",
      "languageName": "Swahili",
      "bcp47": "sw-CD",
      "engine": "piper",
      "modelName": "sw_CD-lanfrica-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sw/sw_CD/lanfrica/medium/sw_CD-lanfrica-medium.onnx",
      "artifactPath": "sw/sw_CD/lanfrica/medium/sw_CD-lanfrica-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "7b28078f0e76cb201dc8b512ea4bf4d6",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "sv",
    "languageName": "Swedish",
    "iso639_2": "swe",
    "bcp47": "sv-SE",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:sv_SE-nst-medium",
      "languageCode": "sv",
      "languageName": "Swedish",
      "bcp47": "sv-SE",
      "engine": "piper",
      "modelName": "sv_SE-nst-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx",
      "artifactPath": "sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "20266cf58e93ca2140444b77398aea04",
      "sizeBytes": 63104526,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:sv_SE-alma-medium",
        "languageCode": "sv",
        "languageName": "Swedish",
        "bcp47": "sv-SE",
        "engine": "piper",
        "modelName": "sv_SE-alma-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sv/sv_SE/alma/medium/sv_SE-alma-medium.onnx",
        "artifactPath": "sv/sv_SE/alma/medium/sv_SE-alma-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "93c03e7c0e2f21e78d123a3ee82d54c1",
        "sizeBytes": 63434611,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:sv_SE-lisa-medium",
        "languageCode": "sv",
        "languageName": "Swedish",
        "bcp47": "sv-SE",
        "engine": "piper",
        "modelName": "sv_SE-lisa-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sv/sv_SE/lisa/medium/sv_SE-lisa-medium.onnx",
        "artifactPath": "sv/sv_SE/lisa/medium/sv_SE-lisa-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "46398d70bbb12d033e15e601a92cd711",
        "sizeBytes": 63511038,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-swe",
        "languageCode": "sv",
        "languageName": "Swedish",
        "bcp47": "sv-SE",
        "engine": "mms",
        "modelName": "facebook/mms-tts-swe",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-swe",
        "artifactPath": "models/mms/facebook_mms-tts-swe",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "tg",
    "languageName": "Tajik",
    "iso639_2": "tgk",
    "bcp47": "tg-TJ",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-tgk",
      "languageCode": "tg",
      "languageName": "Tajik",
      "bcp47": "tg-TJ",
      "engine": "mms",
      "modelName": "facebook/mms-tts-tgk",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-tgk",
      "artifactPath": "models/mms/facebook_mms-tts-tgk",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ta",
    "languageName": "Tamil",
    "iso639_2": "tam",
    "bcp47": "ta-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-tam",
      "languageCode": "ta",
      "languageName": "Tamil",
      "bcp47": "ta-IN",
      "engine": "mms",
      "modelName": "facebook/mms-tts-tam",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-tam",
      "artifactPath": "models/mms/facebook_mms-tts-tam",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "te",
    "languageName": "Telugu",
    "iso639_2": "tel",
    "bcp47": "te-IN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:te_IN-venkatesh-medium",
      "languageCode": "te",
      "languageName": "Telugu",
      "bcp47": "te-IN",
      "engine": "piper",
      "modelName": "te_IN-venkatesh-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/te/te_IN/venkatesh/medium/te_IN-venkatesh-medium.onnx",
      "artifactPath": "te/te_IN/venkatesh/medium/te_IN-venkatesh-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "145092d2d110c4df0fa385dc606fe103",
      "sizeBytes": 63516050,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:te_IN-maya-medium",
        "languageCode": "te",
        "languageName": "Telugu",
        "bcp47": "te-IN",
        "engine": "piper",
        "modelName": "te_IN-maya-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/te/te_IN/maya/medium/te_IN-maya-medium.onnx",
        "artifactPath": "te/te_IN/maya/medium/te_IN-maya-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "604fa4083118495c0fff55826ffccefe",
        "sizeBytes": 62950044,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:te_IN-padmavathi-medium",
        "languageCode": "te",
        "languageName": "Telugu",
        "bcp47": "te-IN",
        "engine": "piper",
        "modelName": "te_IN-padmavathi-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/te/te_IN/padmavathi/medium/te_IN-padmavathi-medium.onnx",
        "artifactPath": "te/te_IN/padmavathi/medium/te_IN-padmavathi-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "1a7fb140ecc8b5e8b3e80e460b719319",
        "sizeBytes": 63516050,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-tel",
        "languageCode": "te",
        "languageName": "Telugu",
        "bcp47": "te-IN",
        "engine": "mms",
        "modelName": "facebook/mms-tts-tel",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-tel",
        "artifactPath": "models/mms/facebook_mms-tts-tel",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "th",
    "languageName": "Thai",
    "iso639_2": "tha",
    "bcp47": "th-TH",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:th_TH-tsync2-medium",
      "languageCode": "th",
      "languageName": "Thai",
      "bcp47": "th-TH",
      "engine": "piper",
      "modelName": "th_TH-tsync2-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/th/th_TH/tsync2/medium/th_TH-tsync2-medium.onnx",
      "artifactPath": "th/th_TH/tsync2/medium/th_TH-tsync2-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "f3f58fc2cfc4f6c591629cb25b47923d",
      "sizeBytes": 63221984,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-tha",
        "languageCode": "th",
        "languageName": "Thai",
        "bcp47": "th-TH",
        "engine": "mms",
        "modelName": "facebook/mms-tts-tha",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-tha",
        "artifactPath": "models/mms/facebook_mms-tts-tha",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "to",
    "languageName": "Tongan",
    "iso639_2": "ton",
    "bcp47": "to-TO",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "tr",
    "languageName": "Turkish",
    "iso639_2": "tur",
    "bcp47": "tr-TR",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:tr_TR-dfki-medium",
      "languageCode": "tr",
      "languageName": "Turkish",
      "bcp47": "tr-TR",
      "engine": "piper",
      "modelName": "tr_TR-dfki-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx",
      "artifactPath": "tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "f51287b350a042dd8d67b2b215145e5a",
      "sizeBytes": 63201294,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "mms:facebook/mms-tts-tur",
        "languageCode": "tr",
        "languageName": "Turkish",
        "bcp47": "tr-TR",
        "engine": "mms",
        "modelName": "facebook/mms-tts-tur",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-tur",
        "artifactPath": "models/mms/facebook_mms-tts-tur",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "Non-Commercial / Lessac Base",
      "datasetLicense": "Research / Community Dataset",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": true,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "tk",
    "languageName": "Turkmen",
    "iso639_2": "tuk",
    "bcp47": "tk-TM",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-tuk-script_arabic",
      "languageCode": "tk",
      "languageName": "Turkmen",
      "bcp47": "tk-TM",
      "engine": "mms",
      "modelName": "facebook/mms-tts-tuk-script_arabic",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-tuk-script_arabic",
      "artifactPath": "models/mms/facebook_mms-tts-tuk-script_arabic",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "uk",
    "languageName": "Ukrainian",
    "iso639_2": "ukr",
    "bcp47": "uk-UA",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:uk_UA-ukrainian_tts-medium",
      "languageCode": "uk",
      "languageName": "Ukrainian",
      "bcp47": "uk-UA",
      "engine": "piper",
      "modelName": "uk_UA-ukrainian_tts-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx",
      "artifactPath": "uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "3366c3d4f31cb77966fb14d042956b4f",
      "sizeBytes": 76735663,
      "sampleRate": 22050,
      "voiceGenders": [
        "multi"
      ],
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:uk_UA-lada-x_low",
        "languageCode": "uk",
        "languageName": "Ukrainian",
        "bcp47": "uk-UA",
        "engine": "piper",
        "modelName": "uk_UA-lada-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/lada/x_low/uk_UA-lada-x_low.onnx",
        "artifactPath": "uk/uk_UA/lada/x_low/uk_UA-lada-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "b84110e3923d64cdd4e0056a22090557",
        "sizeBytes": 20628813,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:uk_UA-mykyta-high",
        "languageCode": "uk",
        "languageName": "Ukrainian",
        "bcp47": "uk-UA",
        "engine": "piper",
        "modelName": "uk_UA-mykyta-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/mykyta/high/uk_UA-mykyta-high.onnx",
        "artifactPath": "uk/uk_UA/mykyta/high/uk_UA-mykyta-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "a044d3c12c99ed7c4b687900b0545a6a",
        "sizeBytes": 114204024,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:uk_UA-oleksa-high",
        "languageCode": "uk",
        "languageName": "Ukrainian",
        "bcp47": "uk-UA",
        "engine": "piper",
        "modelName": "uk_UA-oleksa-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/oleksa/high/uk_UA-oleksa-high.onnx",
        "artifactPath": "uk/uk_UA/oleksa/high/uk_UA-oleksa-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "ceb6d2a5db9834a9da85abb613fa0904",
        "sizeBytes": 114204024,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:uk_UA-tetiana-high",
        "languageCode": "uk",
        "languageName": "Ukrainian",
        "bcp47": "uk-UA",
        "engine": "piper",
        "modelName": "uk_UA-tetiana-high.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/tetiana/high/uk_UA-tetiana-high.onnx",
        "artifactPath": "uk/uk_UA/tetiana/high/uk_UA-tetiana-high.onnx",
        "checksumSha256": null,
        "checksumMd5": "ca4750154e2d635590a41e781d482f2f",
        "sizeBytes": 114204024,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-ukr",
        "languageCode": "uk",
        "languageName": "Ukrainian",
        "bcp47": "uk-UA",
        "engine": "mms",
        "modelName": "facebook/mms-tts-ukr",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-ukr",
        "artifactPath": "models/mms/facebook_mms-tts-ukr",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "ur",
    "languageName": "Urdu",
    "iso639_2": "urd",
    "bcp47": "ur-PK",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:ur_PK-aegis_female-medium",
      "languageCode": "ur",
      "languageName": "Urdu",
      "bcp47": "ur-PK",
      "engine": "piper",
      "modelName": "ur_PK-aegis_female-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ur/ur_PK/aegis_female/medium/ur_PK-aegis_female-medium.onnx",
      "artifactPath": "ur/ur_PK/aegis_female/medium/ur_PK-aegis_female-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "81f9f9772025785f548e1aa0de3361b7",
      "sizeBytes": 63515589,
      "sampleRate": 22050,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "MIT",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:ur_PK-fasih-medium",
        "languageCode": "ur",
        "languageName": "Urdu",
        "bcp47": "ur-PK",
        "engine": "piper",
        "modelName": "ur_PK-fasih-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ur/ur_PK/fasih/medium/ur_PK-fasih-medium.onnx",
        "artifactPath": "ur/ur_PK/fasih/medium/ur_PK-fasih-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "275113cbb8ffb29e3f8d51d53d266318",
        "sizeBytes": 63532015,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "MIT",
        "datasetLicense": "See Model Card",
        "baseLineage": "Direct acoustic training",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-urd",
        "languageCode": "ur",
        "languageName": "Urdu",
        "bcp47": "ur-PK",
        "engine": "mms",
        "modelName": "facebook/mms-tts-urd",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-urd",
        "artifactPath": "models/mms/facebook_mms-tts-urd",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "MIT",
      "datasetLicense": "See Model Card",
      "baseLineage": "Direct acoustic training",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "uz",
    "languageName": "Uzbek",
    "iso639_2": "uzb",
    "bcp47": "uz-UZ",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL_RESEARCH",
    "canonicalEngine": "mms",
    "canonicalModel": {
      "modelId": "mms:facebook/mms-tts-uzb-script_cyrillic",
      "languageCode": "uz",
      "languageName": "Uzbek",
      "bcp47": "uz-UZ",
      "engine": "mms",
      "modelName": "facebook/mms-tts-uzb-script_cyrillic",
      "modelType": "vits-mms",
      "artifactUrl": "https://huggingface.co/facebook/mms-tts-uzb-script_cyrillic",
      "artifactPath": "models/mms/facebook_mms-tts-uzb-script_cyrillic",
      "checksumSha256": null,
      "checksumMd5": null,
      "sizeBytes": null,
      "sampleRate": 16000,
      "voiceGenders": [
        "female"
      ],
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "isFinetuned": false,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 512,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY-NC 4.0",
      "datasetLicense": "CC-BY-NC 4.0",
      "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": true,
      "isFinetuned": false,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "vi",
    "languageName": "Vietnamese",
    "iso639_2": "vie",
    "bcp47": "vi-VN",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:vi_VN-25hours_single-low",
      "languageCode": "vi",
      "languageName": "Vietnamese",
      "bcp47": "vi-VN",
      "engine": "piper",
      "modelName": "vi_VN-25hours_single-low.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/25hours_single/low/vi_VN-25hours_single-low.onnx",
      "artifactPath": "vi/vi_VN/25hours_single/low/vi_VN-25hours_single-low.onnx",
      "checksumSha256": null,
      "checksumMd5": "54ff8fb35b0084336377ddd10717e1fa",
      "sizeBytes": 63104526,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "isFinetuned": true,
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:vi_VN-vais1000-medium",
        "languageCode": "vi",
        "languageName": "Vietnamese",
        "bcp47": "vi-VN",
        "engine": "piper",
        "modelName": "vi_VN-vais1000-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
        "artifactPath": "vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "5e42428c4f6131f75557cf156c9c1526",
        "sizeBytes": 63201294,
        "sampleRate": 22050,
        "voiceGenders": [
          "male"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Fine-tuned acoustic model",
        "isFinetuned": true,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "piper:vi_VN-vivos-x_low",
        "languageCode": "vi",
        "languageName": "Vietnamese",
        "bcp47": "vi-VN",
        "engine": "piper",
        "modelName": "vi_VN-vivos-x_low.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx",
        "artifactPath": "vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx",
        "checksumSha256": null,
        "checksumMd5": "d5880d32e340f57489dcb9d4f1f7aa04",
        "sizeBytes": 27789413,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Fine-tuned acoustic model",
        "isFinetuned": true,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-vie",
        "languageCode": "vi",
        "languageName": "Vietnamese",
        "bcp47": "vi-VN",
        "engine": "mms",
        "modelName": "facebook/mms-tts-vie",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-vie",
        "artifactPath": "models/mms/facebook_mms-tts-vie",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Fine-tuned acoustic model",
      "lineageMentionsLessac": false,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "cy",
    "languageName": "Welsh",
    "iso639_2": "cym",
    "bcp47": "cy-GB",
    "translationCapability": true,
    "technicalCapability": "LOCAL_NEURAL",
    "canonicalEngine": "piper",
    "canonicalModel": {
      "modelId": "piper:cy_GB-gwryw_gogleddol-medium",
      "languageCode": "cy",
      "languageName": "Welsh",
      "bcp47": "cy-GB",
      "engine": "piper",
      "modelName": "cy_GB-gwryw_gogleddol-medium.onnx",
      "modelType": "onnx-piper",
      "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cy/cy_GB/gwryw_gogleddol/medium/cy_GB-gwryw_gogleddol-medium.onnx",
      "artifactPath": "cy/cy_GB/gwryw_gogleddol/medium/cy_GB-gwryw_gogleddol-medium.onnx",
      "checksumSha256": null,
      "checksumMd5": "76ca79c170b0048b190758c3609e9ab9",
      "sizeBytes": 63511038,
      "sampleRate": 22050,
      "voiceGenders": [
        "male"
      ],
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "isFinetuned": true,
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "offlineCapability": true,
      "runtimeRequirements": {
        "minMemoryMB": 256,
        "recommendedThreads": 2,
        "supportedPlatforms": [
          "win32",
          "darwin",
          "linux"
        ]
      },
      "evidence": "VERIFIED"
    },
    "alternativeModels": [
      {
        "modelId": "piper:cy_GB-bu_tts-medium",
        "languageCode": "cy",
        "languageName": "Welsh",
        "bcp47": "cy-GB",
        "engine": "piper",
        "modelName": "cy_GB-bu_tts-medium.onnx",
        "modelType": "onnx-piper",
        "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cy/cy_GB/bu_tts/medium/cy_GB-bu_tts-medium.onnx",
        "artifactPath": "cy/cy_GB/bu_tts/medium/cy_GB-bu_tts-medium.onnx",
        "checksumSha256": null,
        "checksumMd5": "81827b7d290b9c478be3b22e07ee028e",
        "sizeBytes": 77061326,
        "sampleRate": 22050,
        "voiceGenders": [
          "multi"
        ],
        "publishedLicense": "CC-BY 4.0",
        "datasetLicense": "See Model Card",
        "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
        "isFinetuned": true,
        "lineageMentionsLessac": true,
        "lineageMentionsNC": false,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 256,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      },
      {
        "modelId": "mms:facebook/mms-tts-cym",
        "languageCode": "cy",
        "languageName": "Welsh",
        "bcp47": "cy-GB",
        "engine": "mms",
        "modelName": "facebook/mms-tts-cym",
        "modelType": "vits-mms",
        "artifactUrl": "https://huggingface.co/facebook/mms-tts-cym",
        "artifactPath": "models/mms/facebook_mms-tts-cym",
        "checksumSha256": null,
        "checksumMd5": null,
        "sizeBytes": null,
        "sampleRate": 16000,
        "voiceGenders": [
          "female"
        ],
        "publishedLicense": "CC-BY-NC 4.0",
        "datasetLicense": "CC-BY-NC 4.0",
        "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
        "isFinetuned": false,
        "lineageMentionsLessac": false,
        "lineageMentionsNC": true,
        "offlineCapability": true,
        "runtimeRequirements": {
          "minMemoryMB": 512,
          "recommendedThreads": 2,
          "supportedPlatforms": [
            "win32",
            "darwin",
            "linux"
          ]
        },
        "evidence": "VERIFIED"
      }
    ],
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": "CC-BY 4.0",
      "datasetLicense": "See Model Card",
      "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
      "lineageMentionsLessac": true,
      "lineageMentionsNC": false,
      "isFinetuned": true,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "xh",
    "languageName": "Xhosa",
    "iso639_2": "xho",
    "bcp47": "xh-ZA",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  },
  {
    "languageCode": "zu",
    "languageName": "Zulu",
    "iso639_2": "zul",
    "bcp47": "zu-ZA",
    "translationCapability": true,
    "technicalCapability": "SUBTITLE_ONLY",
    "canonicalEngine": null,
    "canonicalModel": null,
    "alternativeModels": [],
    "offlineCapability": false,
    "runtimeRequirements": {
      "minMemoryMB": 64,
      "recommendedThreads": 1,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "provenance": {
      "publishedLicense": null,
      "datasetLicense": null,
      "baseLineage": null,
      "lineageMentionsLessac": null,
      "lineageMentionsNC": null,
      "isFinetuned": null,
      "evidence": "VERIFIED"
    }
  }
];

export const RAW_MODEL_DEFINITIONS = {
  "piper:sq_AL-edon-medium": {
    "modelId": "piper:sq_AL-edon-medium",
    "languageCode": "sq",
    "languageName": "Albanian",
    "bcp47": "sq-AL",
    "engine": "piper",
    "modelName": "sq_AL-edon-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sq/sq_AL/edon/medium/sq_AL-edon-medium.onnx",
    "artifactPath": "sq/sq_AL/edon/medium/sq_AL-edon-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "01888cba8f112271d2cdb6c9de17aae7",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-sqi": {
    "modelId": "mms:facebook/mms-tts-sqi",
    "languageCode": "sq",
    "languageName": "Albanian",
    "bcp47": "sq-AL",
    "engine": "mms",
    "modelName": "facebook/mms-tts-sqi",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-sqi",
    "artifactPath": "models/mms/facebook_mms-tts-sqi",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-amh": {
    "modelId": "mms:facebook/mms-tts-amh",
    "languageCode": "am",
    "languageName": "Amharic",
    "bcp47": "am-ET",
    "engine": "mms",
    "modelName": "facebook/mms-tts-amh",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-amh",
    "artifactPath": "models/mms/facebook_mms-tts-amh",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ar_JO-kareem-medium": {
    "modelId": "piper:ar_JO-kareem-medium",
    "languageCode": "ar",
    "languageName": "Arabic",
    "bcp47": "ar-JO",
    "engine": "piper",
    "modelName": "ar_JO-kareem-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx",
    "artifactPath": "ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "c0697df8a7fb180079cc5ac523f91a8e",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ar_JO-kareem-low": {
    "modelId": "piper:ar_JO-kareem-low",
    "languageCode": "ar",
    "languageName": "Arabic",
    "bcp47": "ar-JO",
    "engine": "piper",
    "modelName": "ar_JO-kareem-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ar/ar_JO/kareem/low/ar_JO-kareem-low.onnx",
    "artifactPath": "ar/ar_JO/kareem/low/ar_JO-kareem-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "d335cd06fe4045a7ee9d8fb0712afaa9",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-ara": {
    "modelId": "mms:facebook/mms-tts-ara",
    "languageCode": "ar",
    "languageName": "Arabic",
    "bcp47": "ar-SA",
    "engine": "mms",
    "modelName": "facebook/mms-tts-ara",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-ara",
    "artifactPath": "models/mms/facebook_mms-tts-ara",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:hy_AM-gor-medium": {
    "modelId": "piper:hy_AM-gor-medium",
    "languageCode": "hy",
    "languageName": "Armenian",
    "bcp47": "hy-AM",
    "engine": "piper",
    "modelName": "hy_AM-gor-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hy/hy_AM/gor/medium/hy_AM-gor-medium.onnx",
    "artifactPath": "hy/hy_AM/gor/medium/hy_AM-gor-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "fd726714c656f1cad828bcf102059aa1",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-asm": {
    "modelId": "mms:facebook/mms-tts-asm",
    "languageCode": "as",
    "languageName": "Assamese",
    "bcp47": "as-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-asm",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-asm",
    "artifactPath": "models/mms/facebook_mms-tts-asm",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-azj-script_latin": {
    "modelId": "mms:facebook/mms-tts-azj-script_latin",
    "languageCode": "az",
    "languageName": "Azerbaijani",
    "bcp47": "az-AZ",
    "engine": "mms",
    "modelName": "facebook/mms-tts-azj-script_latin",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-azj-script_latin",
    "artifactPath": "models/mms/facebook_mms-tts-azj-script_latin",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-azj-script_cyrillic": {
    "modelId": "mms:facebook/mms-tts-azj-script_cyrillic",
    "languageCode": "az",
    "languageName": "Azerbaijani",
    "bcp47": "az-AZ",
    "engine": "mms",
    "modelName": "facebook/mms-tts-azj-script_cyrillic",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-azj-script_cyrillic",
    "artifactPath": "models/mms/facebook_mms-tts-azj-script_cyrillic",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-azb": {
    "modelId": "mms:facebook/mms-tts-azb",
    "languageCode": "az",
    "languageName": "Azerbaijani",
    "bcp47": "az-AZ",
    "engine": "mms",
    "modelName": "facebook/mms-tts-azb",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-azb",
    "artifactPath": "models/mms/facebook_mms-tts-azb",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:eu_ES-antton-medium": {
    "modelId": "piper:eu_ES-antton-medium",
    "languageCode": "eu",
    "languageName": "Basque",
    "bcp47": "eu-ES",
    "engine": "piper",
    "modelName": "eu_ES-antton-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/eu/eu_ES/antton/medium/eu_ES-antton-medium.onnx",
    "artifactPath": "eu/eu_ES/antton/medium/eu_ES-antton-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "4d924421c8f4f3967e79de798209e593",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:eu_ES-maider-medium": {
    "modelId": "piper:eu_ES-maider-medium",
    "languageCode": "eu",
    "languageName": "Basque",
    "bcp47": "eu-ES",
    "engine": "piper",
    "modelName": "eu_ES-maider-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/eu/eu_ES/maider/medium/eu_ES-maider-medium.onnx",
    "artifactPath": "eu/eu_ES/maider/medium/eu_ES-maider-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "0e479a47183ccee8b559e3c69c0a4d96",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-eus": {
    "modelId": "mms:facebook/mms-tts-eus",
    "languageCode": "eu",
    "languageName": "Basque",
    "bcp47": "eu-ES",
    "engine": "mms",
    "modelName": "facebook/mms-tts-eus",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-eus",
    "artifactPath": "models/mms/facebook_mms-tts-eus",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:bn_BD-google-medium": {
    "modelId": "piper:bn_BD-google-medium",
    "languageCode": "bn",
    "languageName": "Bengali",
    "bcp47": "bn-BD",
    "engine": "piper",
    "modelName": "bn_BD-google-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/bn/bn_BD/google/medium/bn_BD-google-medium.onnx",
    "artifactPath": "bn/bn_BD/google/medium/bn_BD-google-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "2a365b2d91bb9cb7ed62c57d9ee0ec48",
    "sizeBytes": 76782515,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC-BY-SA 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-ben": {
    "modelId": "mms:facebook/mms-tts-ben",
    "languageCode": "bn",
    "languageName": "Bengali",
    "bcp47": "bn-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-ben",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-ben",
    "artifactPath": "models/mms/facebook_mms-tts-ben",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-bis": {
    "modelId": "mms:facebook/mms-tts-bis",
    "languageCode": "bi",
    "languageName": "Bislama",
    "bcp47": "bi-VU",
    "engine": "mms",
    "modelName": "facebook/mms-tts-bis",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-bis",
    "artifactPath": "models/mms/facebook_mms-tts-bis",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:bg_BG-dimitar-medium": {
    "modelId": "piper:bg_BG-dimitar-medium",
    "languageCode": "bg",
    "languageName": "Bulgarian",
    "bcp47": "bg-BG",
    "engine": "piper",
    "modelName": "bg_BG-dimitar-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/bg/bg_BG/dimitar/medium/bg_BG-dimitar-medium.onnx",
    "artifactPath": "bg/bg_BG/dimitar/medium/bg_BG-dimitar-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "fc1ce62a4f04f089e22b8c3a13bde28a",
    "sizeBytes": 63221984,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-bul": {
    "modelId": "mms:facebook/mms-tts-bul",
    "languageCode": "bg",
    "languageName": "Bulgarian",
    "bcp47": "bg-BG",
    "engine": "mms",
    "modelName": "facebook/mms-tts-bul",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-bul",
    "artifactPath": "models/mms/facebook_mms-tts-bul",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-mya": {
    "modelId": "mms:facebook/mms-tts-mya",
    "languageCode": "my",
    "languageName": "Burmese",
    "bcp47": "my-MM",
    "engine": "mms",
    "modelName": "facebook/mms-tts-mya",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-mya",
    "artifactPath": "models/mms/facebook_mms-tts-mya",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ca_ES-upc_ona-medium": {
    "modelId": "piper:ca_ES-upc_ona-medium",
    "languageCode": "ca",
    "languageName": "Catalan",
    "bcp47": "ca-ES",
    "engine": "piper",
    "modelName": "ca_ES-upc_ona-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ca/ca_ES/upc_ona/medium/ca_ES-upc_ona-medium.onnx",
    "artifactPath": "ca/ca_ES/upc_ona/medium/ca_ES-upc_ona-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "58ff3b049b6b721a4c353a551ec5ef3a",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY-SA 3.0 ES",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ca_ES-upc_ona-x_low": {
    "modelId": "piper:ca_ES-upc_ona-x_low",
    "languageCode": "ca",
    "languageName": "Catalan",
    "bcp47": "ca-ES",
    "engine": "piper",
    "modelName": "ca_ES-upc_ona-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ca/ca_ES/upc_ona/x_low/ca_ES-upc_ona-x_low.onnx",
    "artifactPath": "ca/ca_ES/upc_ona/x_low/ca_ES-upc_ona-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "ca22734cd8c5b01dd1fefbb42067ab06",
    "sizeBytes": 20628813,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY-SA 3.0 ES",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ca_ES-upc_pau-x_low": {
    "modelId": "piper:ca_ES-upc_pau-x_low",
    "languageCode": "ca",
    "languageName": "Catalan",
    "bcp47": "ca-ES",
    "engine": "piper",
    "modelName": "ca_ES-upc_pau-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ca/ca_ES/upc_pau/x_low/ca_ES-upc_pau-x_low.onnx",
    "artifactPath": "ca/ca_ES/upc_pau/x_low/ca_ES-upc_pau-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "504e8a643d5284fbfc95e9e392288b86",
    "sizeBytes": 28130791,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY-SA 3.0 ES",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-cat": {
    "modelId": "mms:facebook/mms-tts-cat",
    "languageCode": "ca",
    "languageName": "Catalan",
    "bcp47": "ca-ES",
    "engine": "mms",
    "modelName": "facebook/mms-tts-cat",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-cat",
    "artifactPath": "models/mms/facebook_mms-tts-cat",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-ceb": {
    "modelId": "mms:facebook/mms-tts-ceb",
    "languageCode": "ceb",
    "languageName": "Cebuano",
    "bcp47": "ceb-PH",
    "engine": "mms",
    "modelName": "facebook/mms-tts-ceb",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-ceb",
    "artifactPath": "models/mms/facebook_mms-tts-ceb",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "kokoro:zh_CN-huayan": {
    "modelId": "kokoro:zh_CN-huayan",
    "languageCode": "zh",
    "languageName": "Chinese (Mandarin)",
    "bcp47": "zh-CN",
    "engine": "kokoro",
    "modelName": "Kokoro-82M",
    "modelType": "onnx-kokoro",
    "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
    "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": 86200000,
    "sampleRate": 24000,
    "voiceGenders": [
      "female",
      "male"
    ],
    "publishedLicense": "Apache-2.0",
    "datasetLicense": "Permissive community dataset",
    "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:zh_CN-chaowen-medium": {
    "modelId": "piper:zh_CN-chaowen-medium",
    "languageCode": "zh",
    "languageName": "Chinese (Mandarin)",
    "bcp47": "zh-CN",
    "engine": "piper",
    "modelName": "zh_CN-chaowen-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/chaowen/medium/zh_CN-chaowen-medium.onnx",
    "artifactPath": "zh/zh_CN/chaowen/medium/zh_CN-chaowen-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "4965c46e983653811bef0253026ff45a",
    "sizeBytes": 63221984,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:zh_CN-huayan-medium": {
    "modelId": "piper:zh_CN-huayan-medium",
    "languageCode": "zh",
    "languageName": "Chinese (Mandarin)",
    "bcp47": "zh-CN",
    "engine": "piper",
    "modelName": "zh_CN-huayan-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx",
    "artifactPath": "zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "40cdb7930ff91b81574d5f0489e076ea",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:zh_CN-huayan-x_low": {
    "modelId": "piper:zh_CN-huayan-x_low",
    "languageCode": "zh",
    "languageName": "Chinese (Mandarin)",
    "bcp47": "zh-CN",
    "engine": "piper",
    "modelName": "zh_CN-huayan-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/x_low/zh_CN-huayan-x_low.onnx",
    "artifactPath": "zh/zh_CN/huayan/x_low/zh_CN-huayan-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "2b96570db6becd09814a608c8d14a64f",
    "sizeBytes": 20628813,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:zh_CN-xiao_ya-medium": {
    "modelId": "piper:zh_CN-xiao_ya-medium",
    "languageCode": "zh",
    "languageName": "Chinese (Mandarin)",
    "bcp47": "zh-CN",
    "engine": "piper",
    "modelName": "zh_CN-xiao_ya-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/xiao_ya/medium/zh_CN-xiao_ya-medium.onnx",
    "artifactPath": "zh/zh_CN/xiao_ya/medium/zh_CN-xiao_ya-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "b1cece47c5d601a8f6b63b8da82b484a",
    "sizeBytes": 63221984,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:cs_CZ-jirka-medium": {
    "modelId": "piper:cs_CZ-jirka-medium",
    "languageCode": "cs",
    "languageName": "Czech",
    "bcp47": "cs-CZ",
    "engine": "piper",
    "modelName": "cs_CZ-jirka-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium.onnx",
    "artifactPath": "cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "da2deb0a3f93226a3f9b6e40d43c46ca",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:cs_CZ-jirka-low": {
    "modelId": "piper:cs_CZ-jirka-low",
    "languageCode": "cs",
    "languageName": "Czech",
    "bcp47": "cs-CZ",
    "engine": "piper",
    "modelName": "cs_CZ-jirka-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cs/cs_CZ/jirka/low/cs_CZ-jirka-low.onnx",
    "artifactPath": "cs/cs_CZ/jirka/low/cs_CZ-jirka-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "82b99b7adeaccf9fec011458623405b2",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:cs_CZ-kasandra-medium": {
    "modelId": "piper:cs_CZ-kasandra-medium",
    "languageCode": "cs",
    "languageName": "Czech",
    "bcp47": "cs-CZ",
    "engine": "piper",
    "modelName": "cs_CZ-kasandra-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cs/cs_CZ/kasandra/medium/cs_CZ-kasandra-medium.onnx",
    "artifactPath": "cs/cs_CZ/kasandra/medium/cs_CZ-kasandra-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "4b74926a8e7a25e86e1bdb01a25bae66",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:da_DK-talesyntese-medium": {
    "modelId": "piper:da_DK-talesyntese-medium",
    "languageCode": "da",
    "languageName": "Danish",
    "bcp47": "da-DK",
    "engine": "piper",
    "modelName": "da_DK-talesyntese-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx",
    "artifactPath": "da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "9c05494a3e0c1136337581e01222395d",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_BE-rdh-medium": {
    "modelId": "piper:nl_BE-rdh-medium",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-BE",
    "engine": "piper",
    "modelName": "nl_BE-rdh-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_BE/rdh/medium/nl_BE-rdh-medium.onnx",
    "artifactPath": "nl/nl_BE/rdh/medium/nl_BE-rdh-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "33d3469d745677ec4d7e96eb4145b09e",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_BE-nathalie-medium": {
    "modelId": "piper:nl_BE-nathalie-medium",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-BE",
    "engine": "piper",
    "modelName": "nl_BE-nathalie-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_BE/nathalie/medium/nl_BE-nathalie-medium.onnx",
    "artifactPath": "nl/nl_BE/nathalie/medium/nl_BE-nathalie-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "ab0c38b5f66764b59ad9e3e98b1c2172",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_BE-nathalie-x_low": {
    "modelId": "piper:nl_BE-nathalie-x_low",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-BE",
    "engine": "piper",
    "modelName": "nl_BE-nathalie-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_BE/nathalie/x_low/nl_BE-nathalie-x_low.onnx",
    "artifactPath": "nl/nl_BE/nathalie/x_low/nl_BE-nathalie-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "4a00803b60caecad30ea612bcd9f9344",
    "sizeBytes": 20628813,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_BE-rdh-x_low": {
    "modelId": "piper:nl_BE-rdh-x_low",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-BE",
    "engine": "piper",
    "modelName": "nl_BE-rdh-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_BE/rdh/x_low/nl_BE-rdh-x_low.onnx",
    "artifactPath": "nl/nl_BE/rdh/x_low/nl_BE-rdh-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "7d60d0de9ad9ec11a1d293665743afda",
    "sizeBytes": 20628813,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_NL-alex-medium": {
    "modelId": "piper:nl_NL-alex-medium",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-NL",
    "engine": "piper",
    "modelName": "nl_NL-alex-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/alex/medium/nl_NL-alex-medium.onnx",
    "artifactPath": "nl/nl_NL/alex/medium/nl_NL-alex-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "34c3e80cedc491e5d943091cd1b45192",
    "sizeBytes": 63531476,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_NL-mls-medium": {
    "modelId": "piper:nl_NL-mls-medium",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-NL",
    "engine": "piper",
    "modelName": "nl_NL-mls-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx",
    "artifactPath": "nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "f1d4b1452ccfdac24be72085b2b6b55c",
    "sizeBytes": 76584246,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_NL-mls_5809-low": {
    "modelId": "piper:nl_NL-mls_5809-low",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-NL",
    "engine": "piper",
    "modelName": "nl_NL-mls_5809-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls_5809/low/nl_NL-mls_5809-low.onnx",
    "artifactPath": "nl/nl_NL/mls_5809/low/nl_NL-mls_5809-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "e69130a776b04c9962a1fefb4878d7d9",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_NL-mls_7432-low": {
    "modelId": "piper:nl_NL-mls_7432-low",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-NL",
    "engine": "piper",
    "modelName": "nl_NL-mls_7432-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls_7432/low/nl_NL-mls_7432-low.onnx",
    "artifactPath": "nl/nl_NL/mls_7432/low/nl_NL-mls_7432-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "044b69d583e191203997761434607273",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_NL-pim-medium": {
    "modelId": "piper:nl_NL-pim-medium",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-NL",
    "engine": "piper",
    "modelName": "nl_NL-pim-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/pim/medium/nl_NL-pim-medium.onnx",
    "artifactPath": "nl/nl_NL/pim/medium/nl_NL-pim-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "190b3e6463a931d3c583d2fa7cd0e4a0",
    "sizeBytes": 63516050,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:nl_NL-ronnie-medium": {
    "modelId": "piper:nl_NL-ronnie-medium",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-NL",
    "engine": "piper",
    "modelName": "nl_NL-ronnie-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/ronnie/medium/nl_NL-ronnie-medium.onnx",
    "artifactPath": "nl/nl_NL/ronnie/medium/nl_NL-ronnie-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "f74c8e7779cb05f935367d661de5b380",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-nld": {
    "modelId": "mms:facebook/mms-tts-nld",
    "languageCode": "nl",
    "languageName": "Dutch",
    "bcp47": "nl-NL",
    "engine": "mms",
    "modelName": "facebook/mms-tts-nld",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-nld",
    "artifactPath": "models/mms/facebook_mms-tts-nld",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "kokoro:en_US-bryce": {
    "modelId": "kokoro:en_US-bryce",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "kokoro",
    "modelName": "Kokoro-82M",
    "modelType": "onnx-kokoro",
    "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
    "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": 86200000,
    "sampleRate": 24000,
    "voiceGenders": [
      "male",
      "female"
    ],
    "publishedLicense": "Apache-2.0",
    "datasetLicense": "Permissive community dataset",
    "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-alan-low": {
    "modelId": "piper:en_GB-alan-low",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-alan-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/low/en_GB-alan-low.onnx",
    "artifactPath": "en/en_GB/alan/low/en_GB-alan-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "2acae8c79395ab109a7572f0afa61fff",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-alan-medium": {
    "modelId": "piper:en_GB-alan-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-alan-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx",
    "artifactPath": "en/en_GB/alan/medium/en_GB-alan-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "8f6b35eeb8ef6269021c6cb6d2414c9b",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-alba-medium": {
    "modelId": "piper:en_GB-alba-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-alba-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx",
    "artifactPath": "en/en_GB/alba/medium/en_GB-alba-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "c07f313752bb3aba8061041666251654",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-aru-medium": {
    "modelId": "piper:en_GB-aru-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-aru-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/aru/medium/en_GB-aru-medium.onnx",
    "artifactPath": "en/en_GB/aru/medium/en_GB-aru-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "7862d75539b8ef867e7c04e772d323ea",
    "sizeBytes": 76754097,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-cori-high": {
    "modelId": "piper:en_GB-cori-high",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-cori-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/high/en_GB-cori-high.onnx",
    "artifactPath": "en/en_GB/cori/high/en_GB-cori-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "3474a80133d9a03e6870d2ac42c18806",
    "sizeBytes": 114219352,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-cori-medium": {
    "modelId": "piper:en_GB-cori-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-cori-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/medium/en_GB-cori-medium.onnx",
    "artifactPath": "en/en_GB/cori/medium/en_GB-cori-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "f143307611eccea9d976235d0895f57c",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-jenny_dioco-medium": {
    "modelId": "piper:en_GB-jenny_dioco-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-jenny_dioco-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx",
    "artifactPath": "en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "d08f2f7edf0c858275a7eca74ff2a9e4",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-northern_english_male-medium": {
    "modelId": "piper:en_GB-northern_english_male-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-northern_english_male-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx",
    "artifactPath": "en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "4c9a9735bfb76ad67c8b31b23d6840a0",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-semaine-medium": {
    "modelId": "piper:en_GB-semaine-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-semaine-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/semaine/medium/en_GB-semaine-medium.onnx",
    "artifactPath": "en/en_GB/semaine/medium/en_GB-semaine-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "3634c3b388165d3b698ea07ba3cac7d2",
    "sizeBytes": 76737711,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-southern_english_female-low": {
    "modelId": "piper:en_GB-southern_english_female-low",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-southern_english_female-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/southern_english_female/low/en_GB-southern_english_female-low.onnx",
    "artifactPath": "en/en_GB/southern_english_female/low/en_GB-southern_english_female-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "596c7ed4d8488cf64e027765dce2dad1",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_GB-vctk-medium": {
    "modelId": "piper:en_GB-vctk-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-GB",
    "engine": "piper",
    "modelName": "en_GB-vctk-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/vctk/medium/en_GB-vctk-medium.onnx",
    "artifactPath": "en/en_GB/vctk/medium/en_GB-vctk-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "573025290fdc68812543b7438ace0c29",
    "sizeBytes": 76952753,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-amy-low": {
    "modelId": "piper:en_US-amy-low",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-amy-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/low/en_US-amy-low.onnx",
    "artifactPath": "en/en_US/amy/low/en_US-amy-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "3c3f6a6ec605f3a59763256d3b2db012",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-amy-medium": {
    "modelId": "piper:en_US-amy-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-amy-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx",
    "artifactPath": "en/en_US/amy/medium/en_US-amy-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "778d28aeb95fcdf8a882344d9df142fc",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-arctic-medium": {
    "modelId": "piper:en_US-arctic-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-arctic-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/arctic/medium/en_US-arctic-medium.onnx",
    "artifactPath": "en/en_US/arctic/medium/en_US-arctic-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "497c47037c2e279faf467e0a06f965d2",
    "sizeBytes": 76766385,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-bryce-medium": {
    "modelId": "piper:en_US-bryce-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-bryce-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/bryce/medium/en_US-bryce-medium.onnx",
    "artifactPath": "en/en_US/bryce/medium/en_US-bryce-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "a8482817c3bdc3d20121a0e31bfa9809",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-danny-low": {
    "modelId": "piper:en_US-danny-low",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-danny-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/danny/low/en_US-danny-low.onnx",
    "artifactPath": "en/en_US/danny/low/en_US-danny-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "73cc296e178ab3d2a5698179b629cd12",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-hfc_female-medium": {
    "modelId": "piper:en_US-hfc_female-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-hfc_female-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx",
    "artifactPath": "en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "7abec91f1d6e19e913fbc4a333f62787",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-hfc_male-medium": {
    "modelId": "piper:en_US-hfc_male-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-hfc_male-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx",
    "artifactPath": "en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "cd2fda1933f0653d3ddc85e5f30ebdd2",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-joe-medium": {
    "modelId": "piper:en_US-joe-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-joe-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx",
    "artifactPath": "en/en_US/joe/medium/en_US-joe-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "74fd6a4dc39e0aa9dce145d7f5acd4f6",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-john-medium": {
    "modelId": "piper:en_US-john-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-john-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/john/medium/en_US-john-medium.onnx",
    "artifactPath": "en/en_US/john/medium/en_US-john-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "70480857f21f2560f3a232722023b36d",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-kathleen-low": {
    "modelId": "piper:en_US-kathleen-low",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-kathleen-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kathleen/low/en_US-kathleen-low.onnx",
    "artifactPath": "en/en_US/kathleen/low/en_US-kathleen-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "dd1ab131724b1cff76fe388252bec47b",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-kristin-medium": {
    "modelId": "piper:en_US-kristin-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-kristin-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kristin/medium/en_US-kristin-medium.onnx",
    "artifactPath": "en/en_US/kristin/medium/en_US-kristin-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "5fed42d2296baca042e2bf74785db725",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-kusal-medium": {
    "modelId": "piper:en_US-kusal-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-kusal-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kusal/medium/en_US-kusal-medium.onnx",
    "artifactPath": "en/en_US/kusal/medium/en_US-kusal-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "95334de7385a03c5c9de25b920c33492",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-l2arctic-medium": {
    "modelId": "piper:en_US-l2arctic-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-l2arctic-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/l2arctic/medium/en_US-l2arctic-medium.onnx",
    "artifactPath": "en/en_US/l2arctic/medium/en_US-l2arctic-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "a71d8acf9b01676931cd548f739382cd",
    "sizeBytes": 76778673,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-lessac-high": {
    "modelId": "piper:en_US-lessac-high",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-lessac-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx",
    "artifactPath": "en/en_US/lessac/high/en_US-lessac-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "99d1f6181a7f5ccbe3f117ba8ce63c93",
    "sizeBytes": 113895201,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-lessac-low": {
    "modelId": "piper:en_US-lessac-low",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-lessac-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/low/en_US-lessac-low.onnx",
    "artifactPath": "en/en_US/lessac/low/en_US-lessac-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "31883a7506589feadf3c3474fd8ef658",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-lessac-medium": {
    "modelId": "piper:en_US-lessac-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-lessac-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    "artifactPath": "en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "2fc642b535197b6305c7c8f92dc8b24f",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-libritts-high": {
    "modelId": "piper:en_US-libritts-high",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-libritts-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts/high/en_US-libritts-high.onnx",
    "artifactPath": "en/en_US/libritts/high/en_US-libritts-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "61d7845257f8abdc27476f606151ef8d",
    "sizeBytes": 136673811,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-libritts_r-medium": {
    "modelId": "piper:en_US-libritts_r-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-libritts_r-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx",
    "artifactPath": "en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "bb2c2776cffbfd736c7c497f620c0ca6",
    "sizeBytes": 78580914,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-ljspeech-high": {
    "modelId": "piper:en_US-ljspeech-high",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-ljspeech-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx",
    "artifactPath": "en/en_US/ljspeech/high/en_US-ljspeech-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "dad093b5d2cff6a5fda99883ceda09d1",
    "sizeBytes": 114199011,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-ljspeech-medium": {
    "modelId": "piper:en_US-ljspeech-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-ljspeech-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx",
    "artifactPath": "en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "109d552e9dd78d92d1169a7edd6de38d",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-mike-medium": {
    "modelId": "piper:en_US-mike-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-mike-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/mike/medium/en_US-mike-medium.onnx",
    "artifactPath": "en/en_US/mike/medium/en_US-mike-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "032952405bbd4eeae409385cde31b8c5",
    "sizeBytes": 63221984,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-norman-medium": {
    "modelId": "piper:en_US-norman-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-norman-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/norman/medium/en_US-norman-medium.onnx",
    "artifactPath": "en/en_US/norman/medium/en_US-norman-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "829cea515dc724d694b83b71e8083f9f",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-reza_ibrahim-medium": {
    "modelId": "piper:en_US-reza_ibrahim-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-reza_ibrahim-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/reza_ibrahim/medium/en_US-reza_ibrahim-medium.onnx",
    "artifactPath": "en/en_US/reza_ibrahim/medium/en_US-reza_ibrahim-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "b9d4059c794df8336060fb7f36264a43",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-ryan-high": {
    "modelId": "piper:en_US-ryan-high",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-ryan-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx",
    "artifactPath": "en/en_US/ryan/high/en_US-ryan-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "5d879a17bddf5007f76655b445ba78b4",
    "sizeBytes": 120786792,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-ryan-low": {
    "modelId": "piper:en_US-ryan-low",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-ryan-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/low/en_US-ryan-low.onnx",
    "artifactPath": "en/en_US/ryan/low/en_US-ryan-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "32f6a995d6d561cd040b20a76f4edb1e",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-ryan-medium": {
    "modelId": "piper:en_US-ryan-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-ryan-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx",
    "artifactPath": "en/en_US/ryan/medium/en_US-ryan-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "8f06d3aff8ded5a7f13f907e6bec32ac",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:en_US-sam-medium": {
    "modelId": "piper:en_US-sam-medium",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "piper",
    "modelName": "en_US-sam-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/sam/medium/en_US-sam-medium.onnx",
    "artifactPath": "en/en_US/sam/medium/en_US-sam-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "57efcb38a3d0510051f9f55c517ccb76",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-eng": {
    "modelId": "mms:facebook/mms-tts-eng",
    "languageCode": "en",
    "languageName": "English",
    "bcp47": "en-US",
    "engine": "mms",
    "modelName": "facebook/mms-tts-eng",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-eng",
    "artifactPath": "models/mms/facebook_mms-tts-eng",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:et_EE-news-medium": {
    "modelId": "piper:et_EE-news-medium",
    "languageCode": "et",
    "languageName": "Estonian",
    "bcp47": "et-EE",
    "engine": "piper",
    "modelName": "et_EE-news-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/et/et_EE/news/medium/et_EE-news-medium.onnx",
    "artifactPath": "et/et_EE/news/medium/et_EE-news-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "6fba6ec8d985e84435ce680ee9d3b0bc",
    "sizeBytes": 76757937,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC-BY",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-fij": {
    "modelId": "mms:facebook/mms-tts-fij",
    "languageCode": "fj",
    "languageName": "Fijian",
    "bcp47": "fj-FJ",
    "engine": "mms",
    "modelName": "facebook/mms-tts-fij",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-fij",
    "artifactPath": "models/mms/facebook_mms-tts-fij",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-tgl": {
    "modelId": "mms:facebook/mms-tts-tgl",
    "languageCode": "tl",
    "languageName": "Filipino (Tagalog)",
    "bcp47": "fil-PH",
    "engine": "mms",
    "modelName": "facebook/mms-tts-tgl",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-tgl",
    "artifactPath": "models/mms/facebook_mms-tts-tgl",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fi_FI-harri-medium": {
    "modelId": "piper:fi_FI-harri-medium",
    "languageCode": "fi",
    "languageName": "Finnish",
    "bcp47": "fi-FI",
    "engine": "piper",
    "modelName": "fi_FI-harri-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx",
    "artifactPath": "fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "8e96b9e765f8db3e910943520aa0f475",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fi_FI-harri-low": {
    "modelId": "piper:fi_FI-harri-low",
    "languageCode": "fi",
    "languageName": "Finnish",
    "bcp47": "fi-FI",
    "engine": "piper",
    "modelName": "fi_FI-harri-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fi/fi_FI/harri/low/fi_FI-harri-low.onnx",
    "artifactPath": "fi/fi_FI/harri/low/fi_FI-harri-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "f44b67203de7fd488eabc4692d30b598",
    "sizeBytes": 69795191,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-fin": {
    "modelId": "mms:facebook/mms-tts-fin",
    "languageCode": "fi",
    "languageName": "Finnish",
    "bcp47": "fi-FI",
    "engine": "mms",
    "modelName": "facebook/mms-tts-fin",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-fin",
    "artifactPath": "models/mms/facebook_mms-tts-fin",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "kokoro:fr_FR-siwis": {
    "modelId": "kokoro:fr_FR-siwis",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "kokoro",
    "modelName": "Kokoro-82M",
    "modelType": "onnx-kokoro",
    "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
    "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": 86200000,
    "sampleRate": 24000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "Apache-2.0",
    "datasetLicense": "Permissive community dataset",
    "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fr_FR-gilles-low": {
    "modelId": "piper:fr_FR-gilles-low",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "piper",
    "modelName": "fr_FR-gilles-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/gilles/low/fr_FR-gilles-low.onnx",
    "artifactPath": "fr/fr_FR/gilles/low/fr_FR-gilles-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "f984386d1f0927597f09a3ec10b11b5d",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fr_FR-mls-medium": {
    "modelId": "piper:fr_FR-mls-medium",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "piper",
    "modelName": "fr_FR-mls-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx",
    "artifactPath": "fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "87831389d3ae92347d91e38b0c57add9",
    "sizeBytes": 76733750,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fr_FR-mls_1840-low": {
    "modelId": "piper:fr_FR-mls_1840-low",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "piper",
    "modelName": "fr_FR-mls_1840-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/mls_1840/low/fr_FR-mls_1840-low.onnx",
    "artifactPath": "fr/fr_FR/mls_1840/low/fr_FR-mls_1840-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "1873b5d95cb0aad9909d32d1747ae72b",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fr_FR-siwis-low": {
    "modelId": "piper:fr_FR-siwis-low",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "piper",
    "modelName": "fr_FR-siwis-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/low/fr_FR-siwis-low.onnx",
    "artifactPath": "fr/fr_FR/siwis/low/fr_FR-siwis-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "fcb614122005d70f27e4e61e58b4bb56",
    "sizeBytes": 28130791,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fr_FR-siwis-medium": {
    "modelId": "piper:fr_FR-siwis-medium",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "piper",
    "modelName": "fr_FR-siwis-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
    "artifactPath": "fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "20e876e8c839e9b11a26085858f2300c",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fr_FR-tom-medium": {
    "modelId": "piper:fr_FR-tom-medium",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "piper",
    "modelName": "fr_FR-tom-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx",
    "artifactPath": "fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "5b460c2394a871e675f5c798af149412",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fr_FR-upmc-medium": {
    "modelId": "piper:fr_FR-upmc-medium",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "piper",
    "modelName": "fr_FR-upmc-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx",
    "artifactPath": "fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "6837ede9408c7e1b39fa4a126af9e865",
    "sizeBytes": 76733615,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-fra": {
    "modelId": "mms:facebook/mms-tts-fra",
    "languageCode": "fr",
    "languageName": "French",
    "bcp47": "fr-FR",
    "engine": "mms",
    "modelName": "facebook/mms-tts-fra",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-fra",
    "artifactPath": "models/mms/facebook_mms-tts-fra",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ka_GE-natia-medium": {
    "modelId": "piper:ka_GE-natia-medium",
    "languageCode": "ka",
    "languageName": "Georgian",
    "bcp47": "ka-GE",
    "engine": "piper",
    "modelName": "ka_GE-natia-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ka/ka_GE/natia/medium/ka_GE-natia-medium.onnx",
    "artifactPath": "ka/ka_GE/natia/medium/ka_GE-natia-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "83bd40f8d176a83d3d8d605fada2a5e7",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY-SA 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-thorsten-high": {
    "modelId": "piper:de_DE-thorsten-high",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-thorsten-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx",
    "artifactPath": "de/de_DE/thorsten/high/de_DE-thorsten-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "256505fe58fb8b9d6ed78b83f6b8a9d2",
    "sizeBytes": 113895201,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-eva_k-x_low": {
    "modelId": "piper:de_DE-eva_k-x_low",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-eva_k-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/eva_k/x_low/de_DE-eva_k-x_low.onnx",
    "artifactPath": "de/de_DE/eva_k/x_low/de_DE-eva_k-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "51bfc52a58282c2e4fc01ae66567a708",
    "sizeBytes": 20628813,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-karlsson-low": {
    "modelId": "piper:de_DE-karlsson-low",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-karlsson-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/karlsson/low/de_DE-karlsson-low.onnx",
    "artifactPath": "de/de_DE/karlsson/low/de_DE-karlsson-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "c94b5b8e8c7147b4b2c4a19ca5a3c41b",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-kerstin-low": {
    "modelId": "piper:de_DE-kerstin-low",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-kerstin-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/kerstin/low/de_DE-kerstin-low.onnx",
    "artifactPath": "de/de_DE/kerstin/low/de_DE-kerstin-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "1d5e5788cfddb04cbb34418f2841931e",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-mls-medium": {
    "modelId": "piper:de_DE-mls-medium",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-mls-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/mls/medium/de_DE-mls-medium.onnx",
    "artifactPath": "de/de_DE/mls/medium/de_DE-mls-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "bb543a8e82b95993cdd2199a0049623b",
    "sizeBytes": 76961079,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-pavoque-low": {
    "modelId": "piper:de_DE-pavoque-low",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-pavoque-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/pavoque/low/de_DE-pavoque-low.onnx",
    "artifactPath": "de/de_DE/pavoque/low/de_DE-pavoque-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "bc37dccbad87fd65c8501c412c0c31ca",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-ramona-low": {
    "modelId": "piper:de_DE-ramona-low",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-ramona-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/ramona/low/de_DE-ramona-low.onnx",
    "artifactPath": "de/de_DE/ramona/low/de_DE-ramona-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "b4aaf3673170a0d96519cdc992c23fda",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-thorsten-low": {
    "modelId": "piper:de_DE-thorsten-low",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-thorsten-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/low/de_DE-thorsten-low.onnx",
    "artifactPath": "de/de_DE/thorsten/low/de_DE-thorsten-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "c06eb96aceb61895fcb09ffc30eef60b",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-thorsten-medium": {
    "modelId": "piper:de_DE-thorsten-medium",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-thorsten-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx",
    "artifactPath": "de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "a129b00fb3078df43c96bab6c94535c0",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:de_DE-thorsten_emotional-medium": {
    "modelId": "piper:de_DE-thorsten_emotional-medium",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "piper",
    "modelName": "de_DE-thorsten_emotional-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten_emotional/medium/de_DE-thorsten_emotional-medium.onnx",
    "artifactPath": "de/de_DE/thorsten_emotional/medium/de_DE-thorsten_emotional-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "7cc67d24d9d0b34d7a4f6224d16236b9",
    "sizeBytes": 76745905,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-deu": {
    "modelId": "mms:facebook/mms-tts-deu",
    "languageCode": "de",
    "languageName": "German",
    "bcp47": "de-DE",
    "engine": "mms",
    "modelName": "facebook/mms-tts-deu",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-deu",
    "artifactPath": "models/mms/facebook_mms-tts-deu",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:el_GR-rapunzelina-low": {
    "modelId": "piper:el_GR-rapunzelina-low",
    "languageCode": "el",
    "languageName": "Greek",
    "bcp47": "el-GR",
    "engine": "piper",
    "modelName": "el_GR-rapunzelina-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/el/el_GR/rapunzelina/low/el_GR-rapunzelina-low.onnx",
    "artifactPath": "el/el_GR/rapunzelina/low/el_GR-rapunzelina-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "04e0151b653bb64540b1cde027054140",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:el_GR-joy-medium": {
    "modelId": "piper:el_GR-joy-medium",
    "languageCode": "el",
    "languageName": "Greek",
    "bcp47": "el-GR",
    "engine": "piper",
    "modelName": "el_GR-joy-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/el/el_GR/joy/medium/el_GR-joy-medium.onnx",
    "artifactPath": "el/el_GR/joy/medium/el_GR-joy-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "080895960699531c30e70415a75a604d",
    "sizeBytes": 63516050,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:el_GR-rapunzelina-medium": {
    "modelId": "piper:el_GR-rapunzelina-medium",
    "languageCode": "el",
    "languageName": "Greek",
    "bcp47": "el-GR",
    "engine": "piper",
    "modelName": "el_GR-rapunzelina-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/el/el_GR/rapunzelina/medium/el_GR-rapunzelina-medium.onnx",
    "artifactPath": "el/el_GR/rapunzelina/medium/el_GR-rapunzelina-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "265f2f9be00aa5ce81abc1f022145e42",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-ell": {
    "modelId": "mms:facebook/mms-tts-ell",
    "languageCode": "el",
    "languageName": "Greek",
    "bcp47": "el-GR",
    "engine": "mms",
    "modelName": "facebook/mms-tts-ell",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-ell",
    "artifactPath": "models/mms/facebook_mms-tts-ell",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-guj": {
    "modelId": "mms:facebook/mms-tts-guj",
    "languageCode": "gu",
    "languageName": "Gujarati",
    "bcp47": "gu-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-guj",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-guj",
    "artifactPath": "models/mms/facebook_mms-tts-guj",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-hau": {
    "modelId": "mms:facebook/mms-tts-hau",
    "languageCode": "ha",
    "languageName": "Hausa",
    "bcp47": "ha-NG",
    "engine": "mms",
    "modelName": "facebook/mms-tts-hau",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-hau",
    "artifactPath": "models/mms/facebook_mms-tts-hau",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:he_IL-saspeech-medium": {
    "modelId": "piper:he_IL-saspeech-medium",
    "languageCode": "he",
    "languageName": "Hebrew",
    "bcp47": "he-IL",
    "engine": "piper",
    "modelName": "he_IL-saspeech-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/he/he_IL/saspeech/medium/he_IL-saspeech-medium.onnx",
    "artifactPath": "he/he_IL/saspeech/medium/he_IL-saspeech-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "ffa7fbbbbeab5fa8fb7eb00bf9a0e2a5",
    "sizeBytes": 63221984,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-heb": {
    "modelId": "mms:facebook/mms-tts-heb",
    "languageCode": "he",
    "languageName": "Hebrew",
    "bcp47": "he-IL",
    "engine": "mms",
    "modelName": "facebook/mms-tts-heb",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-heb",
    "artifactPath": "models/mms/facebook_mms-tts-heb",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "kokoro:hf_alpha": {
    "modelId": "kokoro:hf_alpha",
    "languageCode": "hi",
    "languageName": "Hindi",
    "bcp47": "hi-IN",
    "engine": "kokoro",
    "modelName": "Kokoro-82M",
    "modelType": "onnx-kokoro",
    "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
    "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": 86200000,
    "sampleRate": 24000,
    "voiceGenders": [
      "female",
      "male"
    ],
    "publishedLicense": "Apache-2.0",
    "datasetLicense": "Permissive community dataset",
    "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:hi_IN-pratham-medium": {
    "modelId": "piper:hi_IN-pratham-medium",
    "languageCode": "hi",
    "languageName": "Hindi",
    "bcp47": "hi-IN",
    "engine": "piper",
    "modelName": "hi_IN-pratham-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx",
    "artifactPath": "hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "f1e5a629a9e533a7155910530109eb86",
    "sizeBytes": 63516050,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:hi_IN-priyamvada-medium": {
    "modelId": "piper:hi_IN-priyamvada-medium",
    "languageCode": "hi",
    "languageName": "Hindi",
    "bcp47": "hi-IN",
    "engine": "piper",
    "modelName": "hi_IN-priyamvada-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx",
    "artifactPath": "hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "7d5e20c2d1e72de8ed772f222e679626",
    "sizeBytes": 63516050,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:hi_IN-rohan-medium": {
    "modelId": "piper:hi_IN-rohan-medium",
    "languageCode": "hi",
    "languageName": "Hindi",
    "bcp47": "hi-IN",
    "engine": "piper",
    "modelName": "hi_IN-rohan-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/rohan/medium/hi_IN-rohan-medium.onnx",
    "artifactPath": "hi/hi_IN/rohan/medium/hi_IN-rohan-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "d63d31559a4ccce62be938ab252a4804",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-hin": {
    "modelId": "mms:facebook/mms-tts-hin",
    "languageCode": "hi",
    "languageName": "Hindi",
    "bcp47": "hi-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-hin",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-hin",
    "artifactPath": "models/mms/facebook_mms-tts-hin",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:hu_HU-anna-medium": {
    "modelId": "piper:hu_HU-anna-medium",
    "languageCode": "hu",
    "languageName": "Hungarian",
    "bcp47": "hu-HU",
    "engine": "piper",
    "modelName": "hu_HU-anna-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hu/hu_HU/anna/medium/hu_HU-anna-medium.onnx",
    "artifactPath": "hu/hu_HU/anna/medium/hu_HU-anna-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "3796f9fa28bd8d390d17828e2e2e952d",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:hu_HU-berta-medium": {
    "modelId": "piper:hu_HU-berta-medium",
    "languageCode": "hu",
    "languageName": "Hungarian",
    "bcp47": "hu-HU",
    "engine": "piper",
    "modelName": "hu_HU-berta-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hu/hu_HU/berta/medium/hu_HU-berta-medium.onnx",
    "artifactPath": "hu/hu_HU/berta/medium/hu_HU-berta-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "a94cc2562ba892f462cb502f9d3c3ca3",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:hu_HU-imre-medium": {
    "modelId": "piper:hu_HU-imre-medium",
    "languageCode": "hu",
    "languageName": "Hungarian",
    "bcp47": "hu-HU",
    "engine": "piper",
    "modelName": "hu_HU-imre-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hu/hu_HU/imre/medium/hu_HU-imre-medium.onnx",
    "artifactPath": "hu/hu_HU/imre/medium/hu_HU-imre-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "aa0b1d1fdd539881c64ed249097e75ff",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-hun": {
    "modelId": "mms:facebook/mms-tts-hun",
    "languageCode": "hu",
    "languageName": "Hungarian",
    "bcp47": "hu-HU",
    "engine": "mms",
    "modelName": "facebook/mms-tts-hun",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-hun",
    "artifactPath": "models/mms/facebook_mms-tts-hun",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:is_IS-ugla-medium": {
    "modelId": "piper:is_IS-ugla-medium",
    "languageCode": "is",
    "languageName": "Icelandic",
    "bcp47": "is-IS",
    "engine": "piper",
    "modelName": "is_IS-ugla-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/is/is_IS/ugla/medium/is_IS-ugla-medium.onnx",
    "artifactPath": "is/is_IS/ugla/medium/is_IS-ugla-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "722fcea3546f0113ad6664290aa97cab",
    "sizeBytes": 76495465,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:is_IS-bui-medium": {
    "modelId": "piper:is_IS-bui-medium",
    "languageCode": "is",
    "languageName": "Icelandic",
    "bcp47": "is-IS",
    "engine": "piper",
    "modelName": "is_IS-bui-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/is/is_IS/bui/medium/is_IS-bui-medium.onnx",
    "artifactPath": "is/is_IS/bui/medium/is_IS-bui-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "08332bb41a67b52a3361bd1e8e36fb10",
    "sizeBytes": 76495465,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:is_IS-salka-medium": {
    "modelId": "piper:is_IS-salka-medium",
    "languageCode": "is",
    "languageName": "Icelandic",
    "bcp47": "is-IS",
    "engine": "piper",
    "modelName": "is_IS-salka-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/is/is_IS/salka/medium/is_IS-salka-medium.onnx",
    "artifactPath": "is/is_IS/salka/medium/is_IS-salka-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "5967c9456b931d6123687d7b78fd81a7",
    "sizeBytes": 76495465,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:is_IS-steinn-medium": {
    "modelId": "piper:is_IS-steinn-medium",
    "languageCode": "is",
    "languageName": "Icelandic",
    "bcp47": "is-IS",
    "engine": "piper",
    "modelName": "is_IS-steinn-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/is/is_IS/steinn/medium/is_IS-steinn-medium.onnx",
    "artifactPath": "is/is_IS/steinn/medium/is_IS-steinn-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "fd8189eb0a72e78d525e70a71aaa792c",
    "sizeBytes": 76495465,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-isl": {
    "modelId": "mms:facebook/mms-tts-isl",
    "languageCode": "is",
    "languageName": "Icelandic",
    "bcp47": "is-IS",
    "engine": "mms",
    "modelName": "facebook/mms-tts-isl",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-isl",
    "artifactPath": "models/mms/facebook_mms-tts-isl",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:id_ID-news_tts-medium": {
    "modelId": "piper:id_ID-news_tts-medium",
    "languageCode": "id",
    "languageName": "Indonesian",
    "bcp47": "id-ID",
    "engine": "piper",
    "modelName": "id_ID-news_tts-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/news_tts/medium/id_ID-news_tts-medium.onnx",
    "artifactPath": "id/id_ID/news_tts/medium/id_ID-news_tts-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "17de01db7ac654655436b6e509893c72",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-ind": {
    "modelId": "mms:facebook/mms-tts-ind",
    "languageCode": "id",
    "languageName": "Indonesian",
    "bcp47": "id-ID",
    "engine": "mms",
    "modelName": "facebook/mms-tts-ind",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-ind",
    "artifactPath": "models/mms/facebook_mms-tts-ind",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "kokoro:it_IT-riccardo": {
    "modelId": "kokoro:it_IT-riccardo",
    "languageCode": "it",
    "languageName": "Italian",
    "bcp47": "it-IT",
    "engine": "kokoro",
    "modelName": "Kokoro-82M",
    "modelType": "onnx-kokoro",
    "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
    "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": 86200000,
    "sampleRate": 24000,
    "voiceGenders": [
      "male",
      "female"
    ],
    "publishedLicense": "Apache-2.0",
    "datasetLicense": "Permissive community dataset",
    "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:it_IT-paola-medium": {
    "modelId": "piper:it_IT-paola-medium",
    "languageCode": "it",
    "languageName": "Italian",
    "bcp47": "it-IT",
    "engine": "piper",
    "modelName": "it_IT-paola-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/paola/medium/it_IT-paola-medium.onnx",
    "artifactPath": "it/it_IT/paola/medium/it_IT-paola-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "3a44e73b12ca5d0c21a72e388b5847c8",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY-SA",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:it_IT-riccardo-x_low": {
    "modelId": "piper:it_IT-riccardo-x_low",
    "languageCode": "it",
    "languageName": "Italian",
    "bcp47": "it-IT",
    "engine": "piper",
    "modelName": "it_IT-riccardo-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/riccardo/x_low/it_IT-riccardo-x_low.onnx",
    "artifactPath": "it/it_IT/riccardo/x_low/it_IT-riccardo-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "2c564b67f6bfaf3ad02d28ab528929b8",
    "sizeBytes": 28130791,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY-SA",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:it_IT-serena-high": {
    "modelId": "piper:it_IT-serena-high",
    "languageCode": "it",
    "languageName": "Italian",
    "bcp47": "it-IT",
    "engine": "piper",
    "modelName": "it_IT-serena-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/serena/high/it_IT-serena-high.onnx",
    "artifactPath": "it/it_IT/serena/high/it_IT-serena-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "0b4d9553883e439fd7bda5475e820bfe",
    "sizeBytes": 114204024,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY-SA",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:it_IT-serena-medium": {
    "modelId": "piper:it_IT-serena-medium",
    "languageCode": "it",
    "languageName": "Italian",
    "bcp47": "it-IT",
    "engine": "piper",
    "modelName": "it_IT-serena-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/serena/medium/it_IT-serena-medium.onnx",
    "artifactPath": "it/it_IT/serena/medium/it_IT-serena-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "f8c82f1139dfa382686bd7564a633400",
    "sizeBytes": 63516051,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY-SA",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "kokoro:jf_alpha": {
    "modelId": "kokoro:jf_alpha",
    "languageCode": "ja",
    "languageName": "Japanese",
    "bcp47": "ja-JP",
    "engine": "kokoro",
    "modelName": "Kokoro-82M",
    "modelType": "onnx-kokoro",
    "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
    "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": 86200000,
    "sampleRate": 24000,
    "voiceGenders": [
      "female",
      "male"
    ],
    "publishedLicense": "Apache-2.0",
    "datasetLicense": "Permissive community dataset",
    "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ja_JP-hi_fi_captain-medium": {
    "modelId": "piper:ja_JP-hi_fi_captain-medium",
    "languageCode": "ja",
    "languageName": "Japanese",
    "bcp47": "ja-JP",
    "engine": "piper",
    "modelName": "ja_JP-hi_fi_captain-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ja/ja_JP/hi_fi_captain/medium/ja_JP-hi_fi_captain-medium.onnx",
    "artifactPath": "ja/ja_JP/hi_fi_captain/medium/ja_JP-hi_fi_captain-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "f9daab8970d06d7e9fc895a879854542",
    "sizeBytes": 76753841,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-jav": {
    "modelId": "mms:facebook/mms-tts-jav",
    "languageCode": "jv",
    "languageName": "Javanese",
    "bcp47": "jv-ID",
    "engine": "mms",
    "modelName": "facebook/mms-tts-jav",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-jav",
    "artifactPath": "models/mms/facebook_mms-tts-jav",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-kan": {
    "modelId": "mms:facebook/mms-tts-kan",
    "languageCode": "kn",
    "languageName": "Kannada",
    "bcp47": "kn-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-kan",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-kan",
    "artifactPath": "models/mms/facebook_mms-tts-kan",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:kk_KZ-issai-high": {
    "modelId": "piper:kk_KZ-issai-high",
    "languageCode": "kk",
    "languageName": "Kazakh",
    "bcp47": "kk-KZ",
    "engine": "piper",
    "modelName": "kk_KZ-issai-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/issai/high/kk_KZ-issai-high.onnx",
    "artifactPath": "kk/kk_KZ/issai/high/kk_KZ-issai-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "d5a97c25feb0949c187ae5f8e72753e3",
    "sizeBytes": 127864258,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:kk_KZ-iseke-x_low": {
    "modelId": "piper:kk_KZ-iseke-x_low",
    "languageCode": "kk",
    "languageName": "Kazakh",
    "bcp47": "kk-KZ",
    "engine": "piper",
    "modelName": "kk_KZ-iseke-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/iseke/x_low/kk_KZ-iseke-x_low.onnx",
    "artifactPath": "kk/kk_KZ/iseke/x_low/kk_KZ-iseke-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "1674f3f4ce48981d77e500741afa4ff9",
    "sizeBytes": 28130791,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:kk_KZ-raya-x_low": {
    "modelId": "piper:kk_KZ-raya-x_low",
    "languageCode": "kk",
    "languageName": "Kazakh",
    "bcp47": "kk-KZ",
    "engine": "piper",
    "modelName": "kk_KZ-raya-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/raya/x_low/kk_KZ-raya-x_low.onnx",
    "artifactPath": "kk/kk_KZ/raya/x_low/kk_KZ-raya-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "476ecc32e07cad26572a50f26d0ebe28",
    "sizeBytes": 28130791,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-kaz": {
    "modelId": "mms:facebook/mms-tts-kaz",
    "languageCode": "kk",
    "languageName": "Kazakh",
    "bcp47": "kk-KZ",
    "engine": "mms",
    "modelName": "facebook/mms-tts-kaz",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-kaz",
    "artifactPath": "models/mms/facebook_mms-tts-kaz",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-khm": {
    "modelId": "mms:facebook/mms-tts-khm",
    "languageCode": "km",
    "languageName": "Khmer",
    "bcp47": "km-KH",
    "engine": "mms",
    "modelName": "facebook/mms-tts-khm",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-khm",
    "artifactPath": "models/mms/facebook_mms-tts-khm",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-kin": {
    "modelId": "mms:facebook/mms-tts-kin",
    "languageCode": "rw",
    "languageName": "Kinyarwanda",
    "bcp47": "rw-RW",
    "engine": "mms",
    "modelName": "facebook/mms-tts-kin",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-kin",
    "artifactPath": "models/mms/facebook_mms-tts-kin",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ko_KR-kss-medium": {
    "modelId": "piper:ko_KR-kss-medium",
    "languageCode": "ko",
    "languageName": "Korean",
    "bcp47": "ko-KR",
    "engine": "piper",
    "modelName": "ko_KR-kss-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx",
    "artifactPath": "ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "bebbd298dffe5ee7b88f2ce41bb4e3a9",
    "sizeBytes": 63221984,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-kor": {
    "modelId": "mms:facebook/mms-tts-kor",
    "languageCode": "ko",
    "languageName": "Korean",
    "bcp47": "ko-KR",
    "engine": "mms",
    "modelName": "facebook/mms-tts-kor",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-kor",
    "artifactPath": "models/mms/facebook_mms-tts-kor",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ku_TR-berfin_renas-medium": {
    "modelId": "piper:ku_TR-berfin_renas-medium",
    "languageCode": "ku",
    "languageName": "Kurdish",
    "bcp47": "ku-TR",
    "engine": "piper",
    "modelName": "ku_TR-berfin_renas-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ku/ku_TR/berfin_renas/medium/ku_TR-berfin_renas-medium.onnx",
    "artifactPath": "ku/ku_TR/berfin_renas/medium/ku_TR-berfin_renas-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "49f32b10c6f577b3dc3f179cac4947b5",
    "sizeBytes": 77060307,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-kir": {
    "modelId": "mms:facebook/mms-tts-kir",
    "languageCode": "ky",
    "languageName": "Kyrgyz",
    "bcp47": "ky-KG",
    "engine": "mms",
    "modelName": "facebook/mms-tts-kir",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-kir",
    "artifactPath": "models/mms/facebook_mms-tts-kir",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-lao": {
    "modelId": "mms:facebook/mms-tts-lao",
    "languageCode": "lo",
    "languageName": "Lao",
    "bcp47": "lo-LA",
    "engine": "mms",
    "modelName": "facebook/mms-tts-lao",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-lao",
    "artifactPath": "models/mms/facebook_mms-tts-lao",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:lv_LV-aivars-medium": {
    "modelId": "piper:lv_LV-aivars-medium",
    "languageCode": "lv",
    "languageName": "Latvian",
    "bcp47": "lv-LV",
    "engine": "piper",
    "modelName": "lv_LV-aivars-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/lv/lv_LV/aivars/medium/lv_LV-aivars-medium.onnx",
    "artifactPath": "lv/lv_LV/aivars/medium/lv_LV-aivars-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "5b48c6f958aea5b7e9ff34f6a10882dd",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-lav": {
    "modelId": "mms:facebook/mms-tts-lav",
    "languageCode": "lv",
    "languageName": "Latvian",
    "bcp47": "lv-LV",
    "engine": "mms",
    "modelName": "facebook/mms-tts-lav",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-lav",
    "artifactPath": "models/mms/facebook_mms-tts-lav",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:lt_LT-reginute1-medium": {
    "modelId": "piper:lt_LT-reginute1-medium",
    "languageCode": "lt",
    "languageName": "Lithuanian",
    "bcp47": "lt-LT",
    "engine": "piper",
    "modelName": "lt_LT-reginute1-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/lt/lt_LT/reginute1/medium/lt_LT-reginute1-medium.onnx",
    "artifactPath": "lt/lt_LT/reginute1/medium/lt_LT-reginute1-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "315dabbe13d83276cb5f921119d87dac",
    "sizeBytes": 63516051,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:lb_LU-marylux-medium": {
    "modelId": "piper:lb_LU-marylux-medium",
    "languageCode": "lb",
    "languageName": "Luxembourgish",
    "bcp47": "lb-LU",
    "engine": "piper",
    "modelName": "lb_LU-marylux-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/lb/lb_LU/marylux/medium/lb_LU-marylux-medium.onnx",
    "artifactPath": "lb/lb_LU/marylux/medium/lb_LU-marylux-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "966856e665a46cee45cb0cd2c475f8d5",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-mai": {
    "modelId": "mms:facebook/mms-tts-mai",
    "languageCode": "mai",
    "languageName": "Maithili",
    "bcp47": "mai-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-mai",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-mai",
    "artifactPath": "models/mms/facebook_mms-tts-mai",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-mlg": {
    "modelId": "mms:facebook/mms-tts-mlg",
    "languageCode": "mg",
    "languageName": "Malagasy",
    "bcp47": "mg-MG",
    "engine": "mms",
    "modelName": "facebook/mms-tts-mlg",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-mlg",
    "artifactPath": "models/mms/facebook_mms-tts-mlg",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ml_IN-arjun-medium": {
    "modelId": "piper:ml_IN-arjun-medium",
    "languageCode": "ml",
    "languageName": "Malayalam",
    "bcp47": "ml-IN",
    "engine": "piper",
    "modelName": "ml_IN-arjun-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ml/ml_IN/arjun/medium/ml_IN-arjun-medium.onnx",
    "artifactPath": "ml/ml_IN/arjun/medium/ml_IN-arjun-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "4f20109c108aa80f46df85ab9cda5daa",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ml_IN-meera-medium": {
    "modelId": "piper:ml_IN-meera-medium",
    "languageCode": "ml",
    "languageName": "Malayalam",
    "bcp47": "ml-IN",
    "engine": "piper",
    "modelName": "ml_IN-meera-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ml/ml_IN/meera/medium/ml_IN-meera-medium.onnx",
    "artifactPath": "ml/ml_IN/meera/medium/ml_IN-meera-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "3eb7b05d25c1551f7a7cec1e1c153b1f",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-mal": {
    "modelId": "mms:facebook/mms-tts-mal",
    "languageCode": "ml",
    "languageName": "Malayalam",
    "bcp47": "ml-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-mal",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-mal",
    "artifactPath": "models/mms/facebook_mms-tts-mal",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:mr_IN-google-medium": {
    "modelId": "piper:mr_IN-google-medium",
    "languageCode": "mr",
    "languageName": "Marathi",
    "bcp47": "mr-IN",
    "engine": "piper",
    "modelName": "mr_IN-google-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/mr/mr_IN/google/medium/mr_IN-google-medium.onnx",
    "artifactPath": "mr/mr_IN/google/medium/mr_IN-google-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "331957abd31bff58aaa10934cd3ac58f",
    "sizeBytes": 76768179,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC-BY-SA 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-mar": {
    "modelId": "mms:facebook/mms-tts-mar",
    "languageCode": "mr",
    "languageName": "Marathi",
    "bcp47": "mr-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-mar",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-mar",
    "artifactPath": "models/mms/facebook_mms-tts-mar",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-mon": {
    "modelId": "mms:facebook/mms-tts-mon",
    "languageCode": "mn",
    "languageName": "Mongolian",
    "bcp47": "mn-MN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-mon",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-mon",
    "artifactPath": "models/mms/facebook_mms-tts-mon",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ne_NP-google-medium": {
    "modelId": "piper:ne_NP-google-medium",
    "languageCode": "ne",
    "languageName": "Nepali",
    "bcp47": "ne-NP",
    "engine": "piper",
    "modelName": "ne_NP-google-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ne/ne_NP/google/medium/ne_NP-google-medium.onnx",
    "artifactPath": "ne/ne_NP/google/medium/ne_NP-google-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "2c24ccfe18eca2f14bccd0a188516109",
    "sizeBytes": 76766385,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC-BY-SA 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ne_NP-chitwan-medium": {
    "modelId": "piper:ne_NP-chitwan-medium",
    "languageCode": "ne",
    "languageName": "Nepali",
    "bcp47": "ne-NP",
    "engine": "piper",
    "modelName": "ne_NP-chitwan-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ne/ne_NP/chitwan/medium/ne_NP-chitwan-medium.onnx",
    "artifactPath": "ne/ne_NP/chitwan/medium/ne_NP-chitwan-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "74cdb5b32816c366af74b55ed7494e25",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY-SA 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ne_NP-google-x_low": {
    "modelId": "piper:ne_NP-google-x_low",
    "languageCode": "ne",
    "languageName": "Nepali",
    "bcp47": "ne-NP",
    "engine": "piper",
    "modelName": "ne_NP-google-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx",
    "artifactPath": "ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "b11030daccc781a7db64c9413197ca8a",
    "sizeBytes": 27693157,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC-BY-SA 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:no_NO-nvcc-medium": {
    "modelId": "piper:no_NO-nvcc-medium",
    "languageCode": "no",
    "languageName": "Norwegian",
    "bcp47": "no-NO",
    "engine": "piper",
    "modelName": "no_NO-nvcc-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/no/no_NO/nvcc/medium/no_NO-nvcc-medium.onnx",
    "artifactPath": "no/no_NO/nvcc/medium/no_NO-nvcc-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "67e04e52b2f195e6db3ae103b58d1710",
    "sizeBytes": 76770227,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:no_NO-talesyntese-medium": {
    "modelId": "piper:no_NO-talesyntese-medium",
    "languageCode": "no",
    "languageName": "Norwegian",
    "bcp47": "no-NO",
    "engine": "piper",
    "modelName": "no_NO-talesyntese-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/no/no_NO/talesyntese/medium/no_NO-talesyntese-medium.onnx",
    "artifactPath": "no/no_NO/talesyntese/medium/no_NO-talesyntese-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "9fc876e7edc6593086b4f2f34889f44b",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-orm": {
    "modelId": "mms:facebook/mms-tts-orm",
    "languageCode": "om",
    "languageName": "Oromo",
    "bcp47": "om-ET",
    "engine": "mms",
    "modelName": "facebook/mms-tts-orm",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-orm",
    "artifactPath": "models/mms/facebook_mms-tts-orm",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fa_IR-amir-medium": {
    "modelId": "piper:fa_IR-amir-medium",
    "languageCode": "fa",
    "languageName": "Persian",
    "bcp47": "fa-IR",
    "engine": "piper",
    "modelName": "fa_IR-amir-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx",
    "artifactPath": "fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "7c0598c9726427869e1e86447b333539",
    "sizeBytes": 63531379,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fa_IR-ganji-medium": {
    "modelId": "piper:fa_IR-ganji-medium",
    "languageCode": "fa",
    "languageName": "Persian",
    "bcp47": "fa-IR",
    "engine": "piper",
    "modelName": "fa_IR-ganji-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/ganji/medium/fa_IR-ganji-medium.onnx",
    "artifactPath": "fa/fa_IR/ganji/medium/fa_IR-ganji-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "b50577af60b986135b37edaeaabb01b9",
    "sizeBytes": 63516050,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fa_IR-ganji_adabi-medium": {
    "modelId": "piper:fa_IR-ganji_adabi-medium",
    "languageCode": "fa",
    "languageName": "Persian",
    "bcp47": "fa-IR",
    "engine": "piper",
    "modelName": "fa_IR-ganji_adabi-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/ganji_adabi/medium/fa_IR-ganji_adabi-medium.onnx",
    "artifactPath": "fa/fa_IR/ganji_adabi/medium/fa_IR-ganji_adabi-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "596844694672ac3d007c544301874553",
    "sizeBytes": 63516050,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fa_IR-gyro-medium": {
    "modelId": "piper:fa_IR-gyro-medium",
    "languageCode": "fa",
    "languageName": "Persian",
    "bcp47": "fa-IR",
    "engine": "piper",
    "modelName": "fa_IR-gyro-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/gyro/medium/fa_IR-gyro-medium.onnx",
    "artifactPath": "fa/fa_IR/gyro/medium/fa_IR-gyro-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "e8ce094894c8ec2a77bfd0397b45d112",
    "sizeBytes": 63122309,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:fa_IR-reza_ibrahim-medium": {
    "modelId": "piper:fa_IR-reza_ibrahim-medium",
    "languageCode": "fa",
    "languageName": "Persian",
    "bcp47": "fa-IR",
    "engine": "piper",
    "modelName": "fa_IR-reza_ibrahim-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/reza_ibrahim/medium/fa_IR-reza_ibrahim-medium.onnx",
    "artifactPath": "fa/fa_IR/reza_ibrahim/medium/fa_IR-reza_ibrahim-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "b9d4059c794df8336060fb7f36264a43",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-fas": {
    "modelId": "mms:facebook/mms-tts-fas",
    "languageCode": "fa",
    "languageName": "Persian",
    "bcp47": "fa-IR",
    "engine": "mms",
    "modelName": "facebook/mms-tts-fas",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-fas",
    "artifactPath": "models/mms/facebook_mms-tts-fas",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pl_PL-darkman-medium": {
    "modelId": "piper:pl_PL-darkman-medium",
    "languageCode": "pl",
    "languageName": "Polish",
    "bcp47": "pl-PL",
    "engine": "piper",
    "modelName": "pl_PL-darkman-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx",
    "artifactPath": "pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "27bf2d71e934b112657544fd0b100a7a",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pl_PL-bass-high": {
    "modelId": "piper:pl_PL-bass-high",
    "languageCode": "pl",
    "languageName": "Polish",
    "bcp47": "pl-PL",
    "engine": "piper",
    "modelName": "pl_PL-bass-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/bass/high/pl_PL-bass-high.onnx",
    "artifactPath": "pl/pl_PL/bass/high/pl_PL-bass-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "427c7c0975ee21cea29db0f58f827883",
    "sizeBytes": 114204024,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pl_PL-gosia-medium": {
    "modelId": "piper:pl_PL-gosia-medium",
    "languageCode": "pl",
    "languageName": "Polish",
    "bcp47": "pl-PL",
    "engine": "piper",
    "modelName": "pl_PL-gosia-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx",
    "artifactPath": "pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "ecf817530e575025166e454adde1f382",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pl_PL-mc_speech-medium": {
    "modelId": "piper:pl_PL-mc_speech-medium",
    "languageCode": "pl",
    "languageName": "Polish",
    "bcp47": "pl-PL",
    "engine": "piper",
    "modelName": "pl_PL-mc_speech-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/mc_speech/medium/pl_PL-mc_speech-medium.onnx",
    "artifactPath": "pl/pl_PL/mc_speech/medium/pl_PL-mc_speech-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "a927e2f2c882bb40cbc2e5f3356ce19b",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pl_PL-mls_6892-low": {
    "modelId": "piper:pl_PL-mls_6892-low",
    "languageCode": "pl",
    "languageName": "Polish",
    "bcp47": "pl-PL",
    "engine": "piper",
    "modelName": "pl_PL-mls_6892-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/mls_6892/low/pl_PL-mls_6892-low.onnx",
    "artifactPath": "pl/pl_PL/mls_6892/low/pl_PL-mls_6892-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "8590d8e979292ca35d20e6e123bfa612",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-pol": {
    "modelId": "mms:facebook/mms-tts-pol",
    "languageCode": "pl",
    "languageName": "Polish",
    "bcp47": "pl-PL",
    "engine": "mms",
    "modelName": "facebook/mms-tts-pol",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-pol",
    "artifactPath": "models/mms/facebook_mms-tts-pol",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "kokoro:pt_BR-edresson": {
    "modelId": "kokoro:pt_BR-edresson",
    "languageCode": "pt",
    "languageName": "Portuguese",
    "bcp47": "pt-BR",
    "engine": "kokoro",
    "modelName": "Kokoro-82M",
    "modelType": "onnx-kokoro",
    "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
    "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": 86200000,
    "sampleRate": 24000,
    "voiceGenders": [
      "female",
      "male"
    ],
    "publishedLicense": "Apache-2.0",
    "datasetLicense": "Permissive community dataset",
    "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pt_BR-cadu-medium": {
    "modelId": "piper:pt_BR-cadu-medium",
    "languageCode": "pt",
    "languageName": "Portuguese",
    "bcp47": "pt-BR",
    "engine": "piper",
    "modelName": "pt_BR-cadu-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/cadu/medium/pt_BR-cadu-medium.onnx",
    "artifactPath": "pt/pt_BR/cadu/medium/pt_BR-cadu-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "6f3a6e23694c9088e3696a15191af2cc",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pt_BR-edresson-low": {
    "modelId": "piper:pt_BR-edresson-low",
    "languageCode": "pt",
    "languageName": "Portuguese",
    "bcp47": "pt-BR",
    "engine": "piper",
    "modelName": "pt_BR-edresson-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/edresson/low/pt_BR-edresson-low.onnx",
    "artifactPath": "pt/pt_BR/edresson/low/pt_BR-edresson-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "53e365c040dd07890fe1855b64c7cc58",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pt_BR-faber-medium": {
    "modelId": "piper:pt_BR-faber-medium",
    "languageCode": "pt",
    "languageName": "Portuguese",
    "bcp47": "pt-BR",
    "engine": "piper",
    "modelName": "pt_BR-faber-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx",
    "artifactPath": "pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "e0724a2f07965f6523d2a1e96b488a4c",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pt_BR-jeff-medium": {
    "modelId": "piper:pt_BR-jeff-medium",
    "languageCode": "pt",
    "languageName": "Portuguese",
    "bcp47": "pt-BR",
    "engine": "piper",
    "modelName": "pt_BR-jeff-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/jeff/medium/pt_BR-jeff-medium.onnx",
    "artifactPath": "pt/pt_BR/jeff/medium/pt_BR-jeff-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "dfb93e9da48638f9efa6b63fdb0b7030",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:pt_PT-tugão-medium": {
    "modelId": "piper:pt_PT-tugão-medium",
    "languageCode": "pt",
    "languageName": "Portuguese",
    "bcp47": "pt-PT",
    "engine": "piper",
    "modelName": "pt_PT-tugão-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_PT/tugão/medium/pt_PT-tugão-medium.onnx",
    "artifactPath": "pt/pt_PT/tugão/medium/pt_PT-tugão-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "0642048511ffe36c3b519520614b53f4",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC-BY",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-por": {
    "modelId": "mms:facebook/mms-tts-por",
    "languageCode": "pt",
    "languageName": "Portuguese",
    "bcp47": "pt-PT",
    "engine": "mms",
    "modelName": "facebook/mms-tts-por",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-por",
    "artifactPath": "models/mms/facebook_mms-tts-por",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-pan": {
    "modelId": "mms:facebook/mms-tts-pan",
    "languageCode": "pa",
    "languageName": "Punjabi",
    "bcp47": "pa-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-pan",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-pan",
    "artifactPath": "models/mms/facebook_mms-tts-pan",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ro_RO-mihai-medium": {
    "modelId": "piper:ro_RO-mihai-medium",
    "languageCode": "ro",
    "languageName": "Romanian",
    "bcp47": "ro-RO",
    "engine": "piper",
    "modelName": "ro_RO-mihai-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ro/ro_RO/mihai/medium/ro_RO-mihai-medium.onnx",
    "artifactPath": "ro/ro_RO/mihai/medium/ro_RO-mihai-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "45f4253916c93d3d05ad3fe1b07ea4f3",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-ron": {
    "modelId": "mms:facebook/mms-tts-ron",
    "languageCode": "ro",
    "languageName": "Romanian",
    "bcp47": "ro-RO",
    "engine": "mms",
    "modelName": "facebook/mms-tts-ron",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-ron",
    "artifactPath": "models/mms/facebook_mms-tts-ron",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ru_RU-dmitri-medium": {
    "modelId": "piper:ru_RU-dmitri-medium",
    "languageCode": "ru",
    "languageName": "Russian",
    "bcp47": "ru-RU",
    "engine": "piper",
    "modelName": "ru_RU-dmitri-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx",
    "artifactPath": "ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "589ccc91745a1e2353508ff62c5941b7",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ru_RU-denis-medium": {
    "modelId": "piper:ru_RU-denis-medium",
    "languageCode": "ru",
    "languageName": "Russian",
    "bcp47": "ru-RU",
    "engine": "piper",
    "modelName": "ru_RU-denis-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/denis/medium/ru_RU-denis-medium.onnx",
    "artifactPath": "ru/ru_RU/denis/medium/ru_RU-denis-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "76c2f14e521fef3ed574f97ad492728e",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ru_RU-irina-medium": {
    "modelId": "piper:ru_RU-irina-medium",
    "languageCode": "ru",
    "languageName": "Russian",
    "bcp47": "ru-RU",
    "engine": "piper",
    "modelName": "ru_RU-irina-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx",
    "artifactPath": "ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "21fbe77fdc68bdc35d7adb6bf4f52199",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ru_RU-ruslan-medium": {
    "modelId": "piper:ru_RU-ruslan-medium",
    "languageCode": "ru",
    "languageName": "Russian",
    "bcp47": "ru-RU",
    "engine": "piper",
    "modelName": "ru_RU-ruslan-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx",
    "artifactPath": "ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "731eb188e63b4c57320e38047ba2d850",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-rus": {
    "modelId": "mms:facebook/mms-tts-rus",
    "languageCode": "ru",
    "languageName": "Russian",
    "bcp47": "ru-RU",
    "engine": "mms",
    "modelName": "facebook/mms-tts-rus",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-rus",
    "artifactPath": "models/mms/facebook_mms-tts-rus",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-smo": {
    "modelId": "mms:facebook/mms-tts-smo",
    "languageCode": "sm",
    "languageName": "Samoan",
    "bcp47": "sm-WS",
    "engine": "mms",
    "modelName": "facebook/mms-tts-smo",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-smo",
    "artifactPath": "models/mms/facebook_mms-tts-smo",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:sr_RS-serbski_institut-medium": {
    "modelId": "piper:sr_RS-serbski_institut-medium",
    "languageCode": "sr",
    "languageName": "Serbian",
    "bcp47": "sr-RS",
    "engine": "piper",
    "modelName": "sr_RS-serbski_institut-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sr/sr_RS/serbski_institut/medium/sr_RS-serbski_institut-medium.onnx",
    "artifactPath": "sr/sr_RS/serbski_institut/medium/sr_RS-serbski_institut-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "02c6e27ac7b4dfa84272df89edca9feb",
    "sizeBytes": 76733615,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:sk_SK-lili-medium": {
    "modelId": "piper:sk_SK-lili-medium",
    "languageCode": "sk",
    "languageName": "Slovak",
    "bcp47": "sk-SK",
    "engine": "piper",
    "modelName": "sk_SK-lili-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sk/sk_SK/lili/medium/sk_SK-lili-medium.onnx",
    "artifactPath": "sk/sk_SK/lili/medium/sk_SK-lili-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "836e078518042448bda8416a8ea52984",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:sl_SI-artur-medium": {
    "modelId": "piper:sl_SI-artur-medium",
    "languageCode": "sl",
    "languageName": "Slovenian",
    "bcp47": "sl-SI",
    "engine": "piper",
    "modelName": "sl_SI-artur-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sl/sl_SI/artur/medium/sl_SI-artur-medium.onnx",
    "artifactPath": "sl/sl_SI/artur/medium/sl_SI-artur-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "ca0aac61139e446bebf98561e8cf9407",
    "sizeBytes": 63200492,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-som": {
    "modelId": "mms:facebook/mms-tts-som",
    "languageCode": "so",
    "languageName": "Somali",
    "bcp47": "so-SO",
    "engine": "mms",
    "modelName": "facebook/mms-tts-som",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-som",
    "artifactPath": "models/mms/facebook_mms-tts-som",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "kokoro:es_ES-carlfm": {
    "modelId": "kokoro:es_ES-carlfm",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-ES",
    "engine": "kokoro",
    "modelName": "Kokoro-82M",
    "modelType": "onnx-kokoro",
    "artifactUrl": "https://huggingface.co/onnx-community/Kokoro-82M-ONNX",
    "artifactPath": "models/kokoro/Kokoro-82M-ONNX",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": 86200000,
    "sampleRate": 24000,
    "voiceGenders": [
      "male",
      "female"
    ],
    "publishedLicense": "Apache-2.0",
    "datasetLicense": "Permissive community dataset",
    "baseLineage": "hexgrad Kokoro-82M StyleTTS2 architecture",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_AR-daniela-high": {
    "modelId": "piper:es_AR-daniela-high",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-AR",
    "engine": "piper",
    "modelName": "es_AR-daniela-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx",
    "artifactPath": "es/es_AR/daniela/high/es_AR-daniela-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "e373fb657c93877dbc438badeadff4cb",
    "sizeBytes": 114199011,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_ES-carlfm-x_low": {
    "modelId": "piper:es_ES-carlfm-x_low",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-ES",
    "engine": "piper",
    "modelName": "es_ES-carlfm-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx",
    "artifactPath": "es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "4137b5aee01ea6241080fc4dbe59a8ee",
    "sizeBytes": 28130791,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_ES-davefx-medium": {
    "modelId": "piper:es_ES-davefx-medium",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-ES",
    "engine": "piper",
    "modelName": "es_ES-davefx-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx",
    "artifactPath": "es/es_ES/davefx/medium/es_ES-davefx-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "dc515cd4ecc5f6f72fe14a941188fc9c",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_ES-mls_10246-low": {
    "modelId": "piper:es_ES-mls_10246-low",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-ES",
    "engine": "piper",
    "modelName": "es_ES-mls_10246-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx",
    "artifactPath": "es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "ab8e93c9d2714fd4481fbca4e2a38891",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_ES-mls_9972-low": {
    "modelId": "piper:es_ES-mls_9972-low",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-ES",
    "engine": "piper",
    "modelName": "es_ES-mls_9972-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_9972/low/es_ES-mls_9972-low.onnx",
    "artifactPath": "es/es_ES/mls_9972/low/es_ES-mls_9972-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "587f2fc38dc3f582e771c3748465e2a2",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_ES-sharvard-medium": {
    "modelId": "piper:es_ES-sharvard-medium",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-ES",
    "engine": "piper",
    "modelName": "es_ES-sharvard-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx",
    "artifactPath": "es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "77e6f9c26e92799fb04bb90b46bf1834",
    "sizeBytes": 76733615,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_MX-ald-medium": {
    "modelId": "piper:es_MX-ald-medium",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-MX",
    "engine": "piper",
    "modelName": "es_MX-ald-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/ald/medium/es_MX-ald-medium.onnx",
    "artifactPath": "es/es_MX/ald/medium/es_MX-ald-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "86374058e59b41ac3b7fe4181e1daad6",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_MX-ald-x_low": {
    "modelId": "piper:es_MX-ald-x_low",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-MX",
    "engine": "piper",
    "modelName": "es_MX-ald-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/ald/x_low/es_MX-ald-x_low.onnx",
    "artifactPath": "es/es_MX/ald/x_low/es_MX-ald-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "b463f8c0972f28f89494961137cd2dc1",
    "sizeBytes": 20986952,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:es_MX-claude-high": {
    "modelId": "piper:es_MX-claude-high",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-MX",
    "engine": "piper",
    "modelName": "es_MX-claude-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high/es_MX-claude-high.onnx",
    "artifactPath": "es/es_MX/claude/high/es_MX-claude-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "cb1966e0ff20ca3aa010f6c9a0ce296a",
    "sizeBytes": 63122309,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Apache 2.0 / CC0",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Direct acoustic training",
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-spa": {
    "modelId": "mms:facebook/mms-tts-spa",
    "languageCode": "es",
    "languageName": "Spanish",
    "bcp47": "es-ES",
    "engine": "mms",
    "modelName": "facebook/mms-tts-spa",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-spa",
    "artifactPath": "models/mms/facebook_mms-tts-spa",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-sun": {
    "modelId": "mms:facebook/mms-tts-sun",
    "languageCode": "su",
    "languageName": "Sundanese",
    "bcp47": "su-ID",
    "engine": "mms",
    "modelName": "facebook/mms-tts-sun",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-sun",
    "artifactPath": "models/mms/facebook_mms-tts-sun",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:sw_CD-lanfrica-medium": {
    "modelId": "piper:sw_CD-lanfrica-medium",
    "languageCode": "sw",
    "languageName": "Swahili",
    "bcp47": "sw-CD",
    "engine": "piper",
    "modelName": "sw_CD-lanfrica-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sw/sw_CD/lanfrica/medium/sw_CD-lanfrica-medium.onnx",
    "artifactPath": "sw/sw_CD/lanfrica/medium/sw_CD-lanfrica-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "7b28078f0e76cb201dc8b512ea4bf4d6",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:sv_SE-nst-medium": {
    "modelId": "piper:sv_SE-nst-medium",
    "languageCode": "sv",
    "languageName": "Swedish",
    "bcp47": "sv-SE",
    "engine": "piper",
    "modelName": "sv_SE-nst-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx",
    "artifactPath": "sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "20266cf58e93ca2140444b77398aea04",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:sv_SE-alma-medium": {
    "modelId": "piper:sv_SE-alma-medium",
    "languageCode": "sv",
    "languageName": "Swedish",
    "bcp47": "sv-SE",
    "engine": "piper",
    "modelName": "sv_SE-alma-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sv/sv_SE/alma/medium/sv_SE-alma-medium.onnx",
    "artifactPath": "sv/sv_SE/alma/medium/sv_SE-alma-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "93c03e7c0e2f21e78d123a3ee82d54c1",
    "sizeBytes": 63434611,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:sv_SE-lisa-medium": {
    "modelId": "piper:sv_SE-lisa-medium",
    "languageCode": "sv",
    "languageName": "Swedish",
    "bcp47": "sv-SE",
    "engine": "piper",
    "modelName": "sv_SE-lisa-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/sv/sv_SE/lisa/medium/sv_SE-lisa-medium.onnx",
    "artifactPath": "sv/sv_SE/lisa/medium/sv_SE-lisa-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "46398d70bbb12d033e15e601a92cd711",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-swe": {
    "modelId": "mms:facebook/mms-tts-swe",
    "languageCode": "sv",
    "languageName": "Swedish",
    "bcp47": "sv-SE",
    "engine": "mms",
    "modelName": "facebook/mms-tts-swe",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-swe",
    "artifactPath": "models/mms/facebook_mms-tts-swe",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-tgk": {
    "modelId": "mms:facebook/mms-tts-tgk",
    "languageCode": "tg",
    "languageName": "Tajik",
    "bcp47": "tg-TJ",
    "engine": "mms",
    "modelName": "facebook/mms-tts-tgk",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-tgk",
    "artifactPath": "models/mms/facebook_mms-tts-tgk",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-tam": {
    "modelId": "mms:facebook/mms-tts-tam",
    "languageCode": "ta",
    "languageName": "Tamil",
    "bcp47": "ta-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-tam",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-tam",
    "artifactPath": "models/mms/facebook_mms-tts-tam",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:te_IN-venkatesh-medium": {
    "modelId": "piper:te_IN-venkatesh-medium",
    "languageCode": "te",
    "languageName": "Telugu",
    "bcp47": "te-IN",
    "engine": "piper",
    "modelName": "te_IN-venkatesh-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/te/te_IN/venkatesh/medium/te_IN-venkatesh-medium.onnx",
    "artifactPath": "te/te_IN/venkatesh/medium/te_IN-venkatesh-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "145092d2d110c4df0fa385dc606fe103",
    "sizeBytes": 63516050,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:te_IN-maya-medium": {
    "modelId": "piper:te_IN-maya-medium",
    "languageCode": "te",
    "languageName": "Telugu",
    "bcp47": "te-IN",
    "engine": "piper",
    "modelName": "te_IN-maya-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/te/te_IN/maya/medium/te_IN-maya-medium.onnx",
    "artifactPath": "te/te_IN/maya/medium/te_IN-maya-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "604fa4083118495c0fff55826ffccefe",
    "sizeBytes": 62950044,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:te_IN-padmavathi-medium": {
    "modelId": "piper:te_IN-padmavathi-medium",
    "languageCode": "te",
    "languageName": "Telugu",
    "bcp47": "te-IN",
    "engine": "piper",
    "modelName": "te_IN-padmavathi-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/te/te_IN/padmavathi/medium/te_IN-padmavathi-medium.onnx",
    "artifactPath": "te/te_IN/padmavathi/medium/te_IN-padmavathi-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "1a7fb140ecc8b5e8b3e80e460b719319",
    "sizeBytes": 63516050,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-tel": {
    "modelId": "mms:facebook/mms-tts-tel",
    "languageCode": "te",
    "languageName": "Telugu",
    "bcp47": "te-IN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-tel",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-tel",
    "artifactPath": "models/mms/facebook_mms-tts-tel",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:th_TH-tsync2-medium": {
    "modelId": "piper:th_TH-tsync2-medium",
    "languageCode": "th",
    "languageName": "Thai",
    "bcp47": "th-TH",
    "engine": "piper",
    "modelName": "th_TH-tsync2-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/th/th_TH/tsync2/medium/th_TH-tsync2-medium.onnx",
    "artifactPath": "th/th_TH/tsync2/medium/th_TH-tsync2-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "f3f58fc2cfc4f6c591629cb25b47923d",
    "sizeBytes": 63221984,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-tha": {
    "modelId": "mms:facebook/mms-tts-tha",
    "languageCode": "th",
    "languageName": "Thai",
    "bcp47": "th-TH",
    "engine": "mms",
    "modelName": "facebook/mms-tts-tha",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-tha",
    "artifactPath": "models/mms/facebook_mms-tts-tha",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:tr_TR-dfki-medium": {
    "modelId": "piper:tr_TR-dfki-medium",
    "languageCode": "tr",
    "languageName": "Turkish",
    "bcp47": "tr-TR",
    "engine": "piper",
    "modelName": "tr_TR-dfki-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx",
    "artifactPath": "tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "f51287b350a042dd8d67b2b215145e5a",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "Non-Commercial / Lessac Base",
    "datasetLicense": "Research / Community Dataset",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-tur": {
    "modelId": "mms:facebook/mms-tts-tur",
    "languageCode": "tr",
    "languageName": "Turkish",
    "bcp47": "tr-TR",
    "engine": "mms",
    "modelName": "facebook/mms-tts-tur",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-tur",
    "artifactPath": "models/mms/facebook_mms-tts-tur",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-tuk-script_arabic": {
    "modelId": "mms:facebook/mms-tts-tuk-script_arabic",
    "languageCode": "tk",
    "languageName": "Turkmen",
    "bcp47": "tk-TM",
    "engine": "mms",
    "modelName": "facebook/mms-tts-tuk-script_arabic",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-tuk-script_arabic",
    "artifactPath": "models/mms/facebook_mms-tts-tuk-script_arabic",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:uk_UA-ukrainian_tts-medium": {
    "modelId": "piper:uk_UA-ukrainian_tts-medium",
    "languageCode": "uk",
    "languageName": "Ukrainian",
    "bcp47": "uk-UA",
    "engine": "piper",
    "modelName": "uk_UA-ukrainian_tts-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx",
    "artifactPath": "uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "3366c3d4f31cb77966fb14d042956b4f",
    "sizeBytes": 76735663,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:uk_UA-lada-x_low": {
    "modelId": "piper:uk_UA-lada-x_low",
    "languageCode": "uk",
    "languageName": "Ukrainian",
    "bcp47": "uk-UA",
    "engine": "piper",
    "modelName": "uk_UA-lada-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/lada/x_low/uk_UA-lada-x_low.onnx",
    "artifactPath": "uk/uk_UA/lada/x_low/uk_UA-lada-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "b84110e3923d64cdd4e0056a22090557",
    "sizeBytes": 20628813,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:uk_UA-mykyta-high": {
    "modelId": "piper:uk_UA-mykyta-high",
    "languageCode": "uk",
    "languageName": "Ukrainian",
    "bcp47": "uk-UA",
    "engine": "piper",
    "modelName": "uk_UA-mykyta-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/mykyta/high/uk_UA-mykyta-high.onnx",
    "artifactPath": "uk/uk_UA/mykyta/high/uk_UA-mykyta-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "a044d3c12c99ed7c4b687900b0545a6a",
    "sizeBytes": 114204024,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:uk_UA-oleksa-high": {
    "modelId": "piper:uk_UA-oleksa-high",
    "languageCode": "uk",
    "languageName": "Ukrainian",
    "bcp47": "uk-UA",
    "engine": "piper",
    "modelName": "uk_UA-oleksa-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/oleksa/high/uk_UA-oleksa-high.onnx",
    "artifactPath": "uk/uk_UA/oleksa/high/uk_UA-oleksa-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "ceb6d2a5db9834a9da85abb613fa0904",
    "sizeBytes": 114204024,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:uk_UA-tetiana-high": {
    "modelId": "piper:uk_UA-tetiana-high",
    "languageCode": "uk",
    "languageName": "Ukrainian",
    "bcp47": "uk-UA",
    "engine": "piper",
    "modelName": "uk_UA-tetiana-high.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/tetiana/high/uk_UA-tetiana-high.onnx",
    "artifactPath": "uk/uk_UA/tetiana/high/uk_UA-tetiana-high.onnx",
    "checksumSha256": null,
    "checksumMd5": "ca4750154e2d635590a41e781d482f2f",
    "sizeBytes": 114204024,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-ukr": {
    "modelId": "mms:facebook/mms-tts-ukr",
    "languageCode": "uk",
    "languageName": "Ukrainian",
    "bcp47": "uk-UA",
    "engine": "mms",
    "modelName": "facebook/mms-tts-ukr",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-ukr",
    "artifactPath": "models/mms/facebook_mms-tts-ukr",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ur_PK-aegis_female-medium": {
    "modelId": "piper:ur_PK-aegis_female-medium",
    "languageCode": "ur",
    "languageName": "Urdu",
    "bcp47": "ur-PK",
    "engine": "piper",
    "modelName": "ur_PK-aegis_female-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ur/ur_PK/aegis_female/medium/ur_PK-aegis_female-medium.onnx",
    "artifactPath": "ur/ur_PK/aegis_female/medium/ur_PK-aegis_female-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "81f9f9772025785f548e1aa0de3361b7",
    "sizeBytes": 63515589,
    "sampleRate": 22050,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "MIT",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:ur_PK-fasih-medium": {
    "modelId": "piper:ur_PK-fasih-medium",
    "languageCode": "ur",
    "languageName": "Urdu",
    "bcp47": "ur-PK",
    "engine": "piper",
    "modelName": "ur_PK-fasih-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ur/ur_PK/fasih/medium/ur_PK-fasih-medium.onnx",
    "artifactPath": "ur/ur_PK/fasih/medium/ur_PK-fasih-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "275113cbb8ffb29e3f8d51d53d266318",
    "sizeBytes": 63532015,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "MIT",
    "datasetLicense": "See Model Card",
    "baseLineage": "Direct acoustic training",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-urd": {
    "modelId": "mms:facebook/mms-tts-urd",
    "languageCode": "ur",
    "languageName": "Urdu",
    "bcp47": "ur-PK",
    "engine": "mms",
    "modelName": "facebook/mms-tts-urd",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-urd",
    "artifactPath": "models/mms/facebook_mms-tts-urd",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-uzb-script_cyrillic": {
    "modelId": "mms:facebook/mms-tts-uzb-script_cyrillic",
    "languageCode": "uz",
    "languageName": "Uzbek",
    "bcp47": "uz-UZ",
    "engine": "mms",
    "modelName": "facebook/mms-tts-uzb-script_cyrillic",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-uzb-script_cyrillic",
    "artifactPath": "models/mms/facebook_mms-tts-uzb-script_cyrillic",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:vi_VN-25hours_single-low": {
    "modelId": "piper:vi_VN-25hours_single-low",
    "languageCode": "vi",
    "languageName": "Vietnamese",
    "bcp47": "vi-VN",
    "engine": "piper",
    "modelName": "vi_VN-25hours_single-low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/25hours_single/low/vi_VN-25hours_single-low.onnx",
    "artifactPath": "vi/vi_VN/25hours_single/low/vi_VN-25hours_single-low.onnx",
    "checksumSha256": null,
    "checksumMd5": "54ff8fb35b0084336377ddd10717e1fa",
    "sizeBytes": 63104526,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:vi_VN-vais1000-medium": {
    "modelId": "piper:vi_VN-vais1000-medium",
    "languageCode": "vi",
    "languageName": "Vietnamese",
    "bcp47": "vi-VN",
    "engine": "piper",
    "modelName": "vi_VN-vais1000-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
    "artifactPath": "vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "5e42428c4f6131f75557cf156c9c1526",
    "sizeBytes": 63201294,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:vi_VN-vivos-x_low": {
    "modelId": "piper:vi_VN-vivos-x_low",
    "languageCode": "vi",
    "languageName": "Vietnamese",
    "bcp47": "vi-VN",
    "engine": "piper",
    "modelName": "vi_VN-vivos-x_low.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx",
    "artifactPath": "vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx",
    "checksumSha256": null,
    "checksumMd5": "d5880d32e340f57489dcb9d4f1f7aa04",
    "sizeBytes": 27789413,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Fine-tuned acoustic model",
    "isFinetuned": true,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-vie": {
    "modelId": "mms:facebook/mms-tts-vie",
    "languageCode": "vi",
    "languageName": "Vietnamese",
    "bcp47": "vi-VN",
    "engine": "mms",
    "modelName": "facebook/mms-tts-vie",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-vie",
    "artifactPath": "models/mms/facebook_mms-tts-vie",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:cy_GB-gwryw_gogleddol-medium": {
    "modelId": "piper:cy_GB-gwryw_gogleddol-medium",
    "languageCode": "cy",
    "languageName": "Welsh",
    "bcp47": "cy-GB",
    "engine": "piper",
    "modelName": "cy_GB-gwryw_gogleddol-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cy/cy_GB/gwryw_gogleddol/medium/cy_GB-gwryw_gogleddol-medium.onnx",
    "artifactPath": "cy/cy_GB/gwryw_gogleddol/medium/cy_GB-gwryw_gogleddol-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "76ca79c170b0048b190758c3609e9ab9",
    "sizeBytes": 63511038,
    "sampleRate": 22050,
    "voiceGenders": [
      "male"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "piper:cy_GB-bu_tts-medium": {
    "modelId": "piper:cy_GB-bu_tts-medium",
    "languageCode": "cy",
    "languageName": "Welsh",
    "bcp47": "cy-GB",
    "engine": "piper",
    "modelName": "cy_GB-bu_tts-medium.onnx",
    "modelType": "onnx-piper",
    "artifactUrl": "https://huggingface.co/rhasspy/piper-voices/resolve/main/cy/cy_GB/bu_tts/medium/cy_GB-bu_tts-medium.onnx",
    "artifactPath": "cy/cy_GB/bu_tts/medium/cy_GB-bu_tts-medium.onnx",
    "checksumSha256": null,
    "checksumMd5": "81827b7d290b9c478be3b22e07ee028e",
    "sizeBytes": 77061326,
    "sampleRate": 22050,
    "voiceGenders": [
      "multi"
    ],
    "publishedLicense": "CC-BY 4.0",
    "datasetLicense": "See Model Card",
    "baseLineage": "Lessac English base fine-tune (Blizzard 2013 non-commercial terms)",
    "isFinetuned": true,
    "lineageMentionsLessac": true,
    "lineageMentionsNC": false,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 256,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  },
  "mms:facebook/mms-tts-cym": {
    "modelId": "mms:facebook/mms-tts-cym",
    "languageCode": "cy",
    "languageName": "Welsh",
    "bcp47": "cy-GB",
    "engine": "mms",
    "modelName": "facebook/mms-tts-cym",
    "modelType": "vits-mms",
    "artifactUrl": "https://huggingface.co/facebook/mms-tts-cym",
    "artifactPath": "models/mms/facebook_mms-tts-cym",
    "checksumSha256": null,
    "checksumMd5": null,
    "sizeBytes": null,
    "sampleRate": 16000,
    "voiceGenders": [
      "female"
    ],
    "publishedLicense": "CC-BY-NC 4.0",
    "datasetLicense": "CC-BY-NC 4.0",
    "baseLineage": "Meta MMS VITS (Massively Multilingual Speech project)",
    "isFinetuned": false,
    "lineageMentionsLessac": false,
    "lineageMentionsNC": true,
    "offlineCapability": true,
    "runtimeRequirements": {
      "minMemoryMB": 512,
      "recommendedThreads": 2,
      "supportedPlatforms": [
        "win32",
        "darwin",
        "linux"
      ]
    },
    "evidence": "VERIFIED"
  }
};
