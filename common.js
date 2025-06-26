const currencySymbol={IE:'€',GB:'£',US:'$',CA:'$',AU:'$',IN:'₹',FR:'€',DE:'€',default:'€'};
const affiliatePrefix={awin:'',cj:''};
let affiliateNetwork='awin';
const ctaLinks={
  IE:{flag:'🇮🇪',affiliate:true,mortgage:'https://switcher.ie/mortgages',savings:'https://bonkers.ie/compare-savings-accounts/',fire:'https://switcher.ie/investments/',pension:''},
  GB:{flag:'🇬🇧',affiliate:true,mortgage:'https://moneyfacts.co.uk/mortgages',savings:'https://moneyfacts.co.uk/savings-accounts/',fire:'https://moneysavingexpert.com/savings/investment-beginners/',pension:''},
  US:{flag:'🇺🇸',affiliate:true,mortgage:'https://nerdwallet.com/mortgages',savings:'https://nerdwallet.com/best/banking/savings-accounts',fire:'https://nerdwallet.com/investing/retirement/fire-movement',pension:''},
  CA:{flag:'🇨🇦',affiliate:true,mortgage:'https://ratehub.ca/mortgage-rates',savings:'https://ratehub.ca/high-interest-savings-accounts',fire:null,pension:''},
  AU:{flag:'🇦🇺',affiliate:true,mortgage:'https://mozo.com.au/home-loans',savings:'https://mozo.com.au/savings-accounts',fire:null,pension:''},
  FR:{flag:'🇫🇷',affiliate:false,mortgage:'https://meilleurtaux.com/',savings:'https://lelynx.fr/banque/comparateur/livret-epargne/',fire:null,pension:''},
  DE:{flag:'🇩🇪',affiliate:false,mortgage:'https://check24.de/',savings:'https://check24.de/tagesgeld/',fire:null,pension:''},
  IN:{flag:'🇮🇳',affiliate:false,mortgage:'https://bankbazaar.com/home-loan.html',savings:'https://bankbazaar.com/savings-account.html',fire:null,pension:''},
  default:{flag:'🌍',affiliate:false,mortgage:'https://www.google.com/search?q=compare+mortgage+rates+${country_name}',savings:'https://www.google.com/search?q=best+savings+accounts+${country_name}',fire:'https://www.google.com/search?q=fire+movement+${country_name}',pension:'https://www.google.com/search?q=pension+options+${country_name}'}
};

const pageTitles={
  fire:{default:'FIRE Calculator'},
  mortgageOverpayment:{default:'Mortgage Overpayment Calculator'},
  ltv:{default:'Loan-to-Value Calculator'},
  savings:{default:'Savings Goal Calculator'},
  pension:{default:'Pension Calculator'},
  investmentReturn:{default:'Investment Return Calculator'},
  mortgageSwitch:{default:'Mortgage Switch Calculator'}
};

const pageText={
  fire:{default:'This calculator helps you estimate how long it might take to reach Financial Independence or Retire Early (FIRE). Your "FIRE number" is the amount of invested savings you\'d need to cover your target annual expenses, without needing to work. The more you can save now, and the lower your future expenses, the faster you can achieve FIRE.'},
  mortgageOverpayment:{default:'See how extra payments reduce your term and interest.'},
  ltv:{default:'Work out your current loan-to-value ratio and equity.'},
  savings:{default:'Find the monthly amount needed to reach your goal.'},
  pension:{default:'Check how much you may need to retire comfortably.'},
  investmentReturn:{default:'Calculate potential returns on your investments.'},
  mortgageSwitch:{default:'Check if switching could save you money.'}
};

function getDynamicCTA(type,name){
  const map={
    mortgage:`Compare mortgage offers in ${name}`,
    savings:`Explore savings rates in ${name}`,
    fire:'Compare platforms to help you reach your FIRE goal',
    pension:`See pension options in ${name}`
  };
  return map[type]||'';
}

function showCTA(type,id,code,name){
  const data=ctaLinks[code]||ctaLinks.default;
  let url=data[type];
  let flag=data.flag;
  if(!url){
    url=ctaLinks.default[type].replace('${country_name}',encodeURIComponent(name));
    flag=ctaLinks.default.flag;
  }else{
    url=url.replace('${country_name}',encodeURIComponent(name));
    if(data.affiliate){
      const prefix=affiliatePrefix[affiliateNetwork]||'';
      if(prefix) url=prefix+encodeURIComponent(url);
    }
  }
  if(!url) return;
  const text=getDynamicCTA(type,name);
  const el=document.getElementById(id);
  if(el){
    el.innerHTML=`<a href="${url}" target="_blank">${flag} ${text}</a>`;
    el.style.display='block';
  }
}

function fetchRegion(){
  return fetch('https://ipapi.co/json/').then(r=>{
    const limit=parseInt(r.headers.get('X-Ratelimit-Limit'))||0;
    const remaining=parseInt(r.headers.get('X-Ratelimit-Remaining'))||0;
    if(limit&&remaining/limit<0.2){
      console.warn('ipapi usage over 80%');
    }
    if(!r.ok) throw new Error('ipapi fail');
    return r.json();
  }).catch(()=>{
    console.log('Using IP fallback');
    document.dispatchEvent(new Event('ipFallbackUsed'));
    return fetch('https://ipwhois.io/json').then(r=>r.json());
  });
}

function applyPageText(key,code,name){
  const title=pageTitles[key]?.[code]||pageTitles[key]?.default||document.title;
  const intro=pageText[key]?.[code]||pageText[key]?.default||'';
  document.title=`${title} — Cruncher.Money`;
  const h1=document.getElementById('pageTitle');
  if(h1) h1.innerText=title;
  const introEl=document.getElementById('introText');
  if(introEl) introEl.innerText=intro;
}

function loadGA(label){
  const s=document.createElement('script');
  s.async=true;
  s.src='https://www.googletagmanager.com/gtag/js?id=G-6Q7ZTXJBC2';
  document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];
  function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
  gtag('js',new Date());
  gtag('config','G-6Q7ZTXJBC2');
  document.body?.addEventListener('click',e=>{
    const link=e.target.closest('a');
    if(link&&link.href&&link.hostname!==location.hostname&&window.gtag){
      gtag('event','click',{event_category:'outbound',event_label:`${label}|${link.href}`});
    }
  });
}

function startCookieConsent(label){
  window.addEventListener('load',function(){
    window.cookieconsent.initialise({
      type:'opt-in',
      palette:{popup:{background:'#f7f5ed',text:'#000'},button:{background:'#004225',text:'#fff'}},
      theme:'classic',
      content:{
        message:'We use cookies to analyse site usage (Google Analytics), only after you click Accept.',
        allow:'Accept',
        deny:'Reject',
        link:'Learn more',
        href:'/privacy.html'
      },
      onInitialise:function(){ if(this.hasConsented()) loadGA(label); },
      onStatusChange:function(){ if(this.hasConsented()) loadGA(label); }
    });
    var s=document.createElement('style');
    s.innerHTML='.cc-btn.cc-deny{background:#fff;border:1px solid #004225;color:#004225;}';
    document.head.appendChild(s);
  });
}
