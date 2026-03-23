import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import SchuelerPage from '@/pages/SchuelerPage';
import FahrlehrerPage from '@/pages/FahrlehrerPage';
import FahrzeugePage from '@/pages/FahrzeugePage';
import PruefungsterminePage from '@/pages/PruefungsterminePage';
import FahrstundenPage from '@/pages/FahrstundenPage';
import SchnelleintragFahrstundePage from '@/pages/SchnelleintragFahrstundePage';
import FahrstundeErfassenPage from '@/pages/intents/FahrstundeErfassenPage';
import SchuelerFortschrittPage from '@/pages/intents/SchuelerFortschrittPage';
import PruefungVorbereitenPage from '@/pages/intents/PruefungVorbereitenPage';
import FahrzeugStatusPage from '@/pages/intents/FahrzeugStatusPage';

export default function App() {
  return (
    <HashRouter>
      <ActionsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="schueler" element={<SchuelerPage />} />
            <Route path="fahrlehrer" element={<FahrlehrerPage />} />
            <Route path="fahrzeuge" element={<FahrzeugePage />} />
            <Route path="pruefungstermine" element={<PruefungsterminePage />} />
            <Route path="fahrstunden" element={<FahrstundenPage />} />
            <Route path="schnelleintrag-fahrstunde" element={<SchnelleintragFahrstundePage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="intents/fahrstunde-erfassen" element={<FahrstundeErfassenPage />} />
            <Route path="intents/schueler-fortschritt" element={<SchuelerFortschrittPage />} />
            <Route path="intents/pruefung-vorbereiten" element={<PruefungVorbereitenPage />} />
            <Route path="intents/fahrzeug-status" element={<FahrzeugStatusPage />} />
          </Route>
        </Routes>
      </ActionsProvider>
    </HashRouter>
  );
}
