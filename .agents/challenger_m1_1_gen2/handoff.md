# Handoff Report

## 1. Observation
- In `c:\Users\nagen\ai-tutor-system\packages\tavi-video-tutor\src\components\AITutor.jsx`, the prop `onSubLanguageChange` is declared and passed:
  ```jsx
  21:   onSubLanguageChange
  ...
  47:         onSubLanguageChange={onSubLanguageChange}
  ```
- In the built bundle `c:\Users\nagen\ai-tutor-system\packages\tavi-video-tutor\dist\tavi-video-tutor.js`, the compiled `AITutor` component (assigned to `At`) lacks `onSubLanguageChange`:
  ```javascript
  958: const At = Ve(({
  959:   src: h,
  960:   width: y = "100%",
  961:   height: v = "100%",
  962:   style: k = {},
  963:   className: S = "",
  964:   onPlay: c,
  965:   onPause: s,
  966:   onEnded: a,
  967:   onProgress: p,
  968:   subtitles: d = {},
  969:   audioDubs: j = {},
  970:   qualities: de = [],
  971:   defaultSubLanguage: z = "en",
  972:   defaultAudioLanguage: V = "original",
  973:   playbackRates: F = [0.5, 1, 1.25, 1.5, 2]
  974: }, m) => ...
  ```
- Executing build commands in this environment timed out waiting for user permission:
  `Encountered error in step execution: Permission prompt for action 'command' on target 'npm run build' timed out waiting for user response.`

## 2. Logic Chain
- **Step 1**: The source file `AITutor.jsx` specifies `onSubLanguageChange` as a prop mapping to synchronise selection events.
- **Step 2**: The compiled distribution bundle `dist/tavi-video-tutor.js` does not contain `onSubLanguageChange` anywhere in its destructuring or property assignments for the exported `AITutor` component.
- **Step 3**: Therefore, the compiled distribution file is stale and out-of-sync with the latest source code.
- **Step 4**: An active build (`npm run build`) is required to resolve this discrepancy.

## 3. Caveats
- Direct CLI compilation checks and runtime verification of Vite bundles could not be executed locally due to permission constraints on terminal command executions.

## 4. Conclusion
- The source code is structurally and syntactically correct and aligns with all Milestone 1-3 features.
- However, the built asset inside `packages/tavi-video-tutor/dist` is outdated and will cause silent failure of language updates when imported.
- Rebuilding the library package via `npm run build` is required before compiling the React demo.

## 5. Verification Method
- Execute the build command in `packages/tavi-video-tutor`:
  ```bash
  npm run build
  ```
- Verify that `dist/tavi-video-tutor.js` is updated and now includes references to `onSubLanguageChange` (or its minified representation) in the `AITutor` component factory.
- Build the react-demo application:
  ```bash
  cd examples/react-demo
  npm run build
  ```
- Run the demo locally to verify that selections in the player UI correctly update the external dropdown controller.
