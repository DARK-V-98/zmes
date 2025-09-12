# Firebase Studio Z Messenger

This is a Next.js chat application built in Firebase Studio.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

## Firebase Configuration

### Authorizing OAuth Domains

During development, you may see a warning in the browser console about the current domain not being authorized for OAuth operations. This is expected and can be resolved by adding your development domain to the authorized list in your Firebase project.

1.  **Open the Firebase Console:** Go to your Firebase project's console.
2.  **Navigate to Authentication:** In the left-hand menu, go to `Authentication`.
3.  **Go to Settings:** Click on the `Settings` tab.
4.  **Authorized Domains:** Under the `Authorized domains` section, click `Add domain`.
5.  **Add Your Domain:** Add the domain from the warning message (e.g., `....cloudworkstations.dev`) to the list.

This will authorize your development environment and remove the warning.
