'use client'

import './globals.css'
import Navbar from '../components/Navbar'
import { UserProvider } from '../contexts/UserContext'



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <Navbar />
          <main className="container-xl py-8 md:py-12">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  )
}
// import './globals.css';
// import Navbar from '../components/Navbar';

// export const metadata = {
//   title: 'SkinAI',
//   description: 'Skin analyzer demo',
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="th">
//       <body>
//         <Navbar />
//         <main>{children}</main>
//       </body>
//     </html>
//   );
// }
