/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RealMarsMap } from './components/map/RealMarsMap';
import { MarsWelcomeSplash } from './components/common/MarsWelcomeSplash';

export default function App() {
  return (
    <main className="w-full h-full h-[100dvh] overflow-hidden bg-[#070a12]">
      <RealMarsMap />
      <MarsWelcomeSplash />
    </main>
  );
}
