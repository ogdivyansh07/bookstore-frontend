import { render, screen } from '@testing-library/react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { Admin } from './App';

test('loads admin panel using hash route', () => {
  window.location.hash = '/admin';

  render(
    <Router>
      <Routes>
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );

  const adminLoginHeading = screen.getByText(/admin login/i);
  expect(adminLoginHeading).toBeInTheDocument();
});
