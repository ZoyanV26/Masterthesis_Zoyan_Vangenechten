import React, { useState } from "react";

function SearchForm({ onSearch }) {
  const [formData, setFormData] = useState({
    postcode: "",
    gemeente: "",
    straat: "",
    huisnummer: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Postcode:</label>
      <input type="text" name="postcode" onChange={handleChange} required />

      <label>Gemeente:</label>
      <input type="text" name="gemeente" onChange={handleChange} required />

      <label>Straat:</label>
      <input type="text" name="straat" onChange={handleChange} required />

      <label>Huisnummer:</label>
      <input type="text" name="huisnummer" onChange={handleChange} required />

      <button type="submit">Zoek woning</button>
    </form>
  );
}

export default SearchForm;
