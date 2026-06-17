'use strict';

const fmtCurrency = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPercent = (n) =>
  n.toFixed(2) + '%';

const fmtPeriods = (n) =>
  Number.isInteger(n) ? String(n) : n.toFixed(2);

function validate(fv, couponPct, marketPct, years, freq) {
  const errors = [];
  const ids = [];

  if (fv === '' || isNaN(fv) || Number(fv) <= 0) {
    errors.push('Please enter a face value greater than 0.');
    ids.push('face-value');
  }
  if (couponPct === '' || isNaN(couponPct) || Number(couponPct) < 0) {
    errors.push('Please enter a coupon rate of 0 or greater.');
    ids.push('coupon-rate');
  }
  if (marketPct === '' || isNaN(marketPct) || Number(marketPct) < 0) {
    errors.push('Please enter a market interest rate of 0 or greater.');
    ids.push('market-rate');
  }
  if (years === '' || isNaN(years) || Number(years) <= 0) {
    errors.push('Please enter years to maturity greater than 0.');
    ids.push('years');
  }
  if (!['1', '2', '4', '12'].includes(String(freq))) {
    errors.push('Please select a valid compounding frequency.');
    ids.push('frequency');
  }

  return { errors, ids };
}

function calculate() {
  const fvRaw      = document.getElementById('face-value').value.trim();
  const couponRaw  = document.getElementById('coupon-rate').value.trim();
  const marketRaw  = document.getElementById('market-rate').value.trim();
  const yearsRaw   = document.getElementById('years').value.trim();
  const freqRaw    = document.getElementById('frequency').value;

  clearErrors();
  clearResults();

  const { errors, ids } = validate(fvRaw, couponRaw, marketRaw, yearsRaw, freqRaw);

  if (errors.length > 0) {
    showErrors(errors, ids);
    return;
  }

  const FV         = Number(fvRaw);
  const couponRate = Number(couponRaw) / 100;
  const marketRate = Number(marketRaw) / 100;
  const years      = Number(yearsRaw);
  const m          = Number(freqRaw);

  const periodicCoupon = FV * couponRate / m;
  const periodicRate   = marketRate / m;
  const totalPeriods   = years * m;

  let pvCoupons, pvFaceValue;

  if (periodicRate === 0) {
    pvCoupons   = periodicCoupon * totalPeriods;
    pvFaceValue = FV;
  } else {
    pvCoupons   = periodicCoupon * (1 - Math.pow(1 + periodicRate, -totalPeriods)) / periodicRate;
    pvFaceValue = FV / Math.pow(1 + periodicRate, totalPeriods);
  }

  const bondPrice = pvCoupons + pvFaceValue;

  document.getElementById('res-coupon').textContent    = fmtCurrency(periodicCoupon);
  document.getElementById('res-rate').textContent      = fmtPercent(periodicRate * 100);
  document.getElementById('res-periods').textContent   = fmtPeriods(totalPeriods);
  document.getElementById('res-pv-coupons').textContent = fmtCurrency(pvCoupons);
  document.getElementById('res-pv-face').textContent   = fmtCurrency(pvFaceValue);
  document.getElementById('res-bond-price').textContent = fmtCurrency(bondPrice);

  const statusEl = document.getElementById('price-status');
  const diff = bondPrice - FV;
  const EPSILON = 0.005;
  if (Math.abs(diff) < EPSILON) {
    statusEl.className = 'price-status par';
    statusEl.textContent = 'This bond is selling at par because its price equals face value.';
  } else if (diff < 0) {
    statusEl.className = 'price-status discount';
    statusEl.textContent = 'This bond is selling at a discount because its price is below face value.';
  } else {
    statusEl.className = 'price-status premium';
    statusEl.textContent = 'This bond is selling at a premium because its price is above face value.';
  }

  document.getElementById('results-section').classList.add('visible');
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function reset() {
  document.getElementById('face-value').value  = '';
  document.getElementById('coupon-rate').value = '';
  document.getElementById('market-rate').value = '';
  document.getElementById('years').value        = '';
  document.getElementById('frequency').value    = '2';
  clearErrors();
  clearResults();
}

function loadExample() {
  document.getElementById('face-value').value  = '1000';
  document.getElementById('coupon-rate').value = '6';
  document.getElementById('market-rate').value = '8';
  document.getElementById('years').value        = '10';
  document.getElementById('frequency').value    = '2';
  clearErrors();
  clearResults();
}

function showErrors(errors, ids) {
  const box  = document.getElementById('error-box');
  const list = document.getElementById('error-list');
  list.innerHTML = '';
  errors.forEach((msg) => {
    const li = document.createElement('li');
    li.textContent = msg;
    list.appendChild(li);
  });
  box.classList.add('visible');

  // Mark invalid fields
  ['face-value', 'coupon-rate', 'market-rate', 'years', 'frequency'].forEach((id) => {
    document.getElementById(id).classList.remove('invalid');
  });
  ids.forEach((id) => document.getElementById(id).classList.add('invalid'));

  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearErrors() {
  document.getElementById('error-box').classList.remove('visible');
  document.getElementById('error-list').innerHTML = '';
  ['face-value', 'coupon-rate', 'market-rate', 'years', 'frequency'].forEach((id) => {
    document.getElementById(id).classList.remove('invalid');
  });
}

function clearResults() {
  document.getElementById('results-section').classList.remove('visible');
  ['res-coupon', 'res-rate', 'res-periods', 'res-pv-coupons', 'res-pv-face', 'res-bond-price'].forEach((id) => {
    document.getElementById(id).textContent = '';
  });
  const statusEl = document.getElementById('price-status');
  statusEl.textContent = '';
  statusEl.className = 'price-status';
}

function copySummary() {
  const freqLabels = { '1': 'Annual (1×/year)', '2': 'Semiannual (2×/year)', '4': 'Quarterly (4×/year)', '12': 'Monthly (12×/year)' };

  const fv        = document.getElementById('face-value').value;
  const coupon    = document.getElementById('coupon-rate').value;
  const market    = document.getElementById('market-rate').value;
  const years     = document.getElementById('years').value;
  const freqVal   = document.getElementById('frequency').value;
  const freqLabel = freqLabels[freqVal] || freqVal;

  const resCoupon   = document.getElementById('res-coupon').textContent;
  const resRate     = document.getElementById('res-rate').textContent;
  const resPeriods  = document.getElementById('res-periods').textContent;
  const resPvCoup   = document.getElementById('res-pv-coupons').textContent;
  const resPvFace   = document.getElementById('res-pv-face').textContent;
  const resBondPrice = document.getElementById('res-bond-price').textContent;
  const takeaway    = document.getElementById('price-status').textContent;

  const pad = (label, value) => label.padEnd(34, ' ') + value;

  const lines = [
    'Bond Price Calculator — Summary',
    '='.repeat(48),
    '',
    'INPUTS',
    '  ' + pad('Face Value:', '$' + Number(fv).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
    '  ' + pad('Annual Coupon Rate:', Number(coupon).toFixed(2) + '%'),
    '  ' + pad('Annual Market Rate:', Number(market).toFixed(2) + '%'),
    '  ' + pad('Years to Maturity:', years),
    '  ' + pad('Payment Frequency:', freqLabel),
    '',
    'CALCULATION RESULTS',
    '  ' + pad('Coupon Payment per Period:', resCoupon),
    '  ' + pad('Interest Rate per Period:', resRate),
    '  ' + pad('Total Number of Periods:', resPeriods),
    '  ' + pad('PV of Coupon Payments:', resPvCoup),
    '  ' + pad('PV of Face Value:', resPvFace),
    '',
    '  ' + pad('BOND PRICE:', resBondPrice),
  ];

  if (takeaway) {
    lines.push('', 'TAKEAWAY', '  ' + takeaway);
  }

  lines.push('', '-'.repeat(48));
  lines.push('Generated by Bond Price Calculator');

  const text = lines.join('\n');

  const btn = document.getElementById('btn-copy');
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy Summary';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // Fallback for environments where clipboard API is unavailable
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy Summary';
      btn.classList.remove('copied');
    }, 2000);
  });
}

document.getElementById('btn-calculate').addEventListener('click', calculate);
document.getElementById('btn-reset').addEventListener('click', reset);
document.getElementById('btn-example').addEventListener('click', loadExample);
document.getElementById('btn-copy').addEventListener('click', copySummary);
