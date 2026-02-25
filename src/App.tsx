/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { generateKeyPair, PublicKey, PrivateKey } from './utils/paillier';
import { Shield, Key, Vote, Server, Lock, Unlock, CheckCircle2, RefreshCw, AlertCircle, Calculator } from 'lucide-react';

type Candidate = 'Alice' | 'Bob' | 'Charlie';
const CANDIDATES: Candidate[] = ['Alice', 'Bob', 'Charlie'];

interface EncryptedVote {
  id: string;
  voterName: string;
  encryptedData: Record<Candidate, string>;
}

export default function App() {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [privateKey, setPrivateKey] = useState<PrivateKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [votes, setVotes] = useState<EncryptedVote[]>([]);
  const [voterName, setVoterName] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | ''>('');
  
  const [aggregatedVote, setAggregatedVote] = useState<Record<Candidate, string> | null>(null);
  const [decryptedResults, setDecryptedResults] = useState<Record<Candidate, number> | null>(null);

  const handleGenerateKeys = () => {
    setIsGenerating(true);
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const { publicKey, privateKey } = generateKeyPair(128); // 128-bit primes for speed
      setPublicKey(publicKey);
      setPrivateKey(privateKey);
      setVotes([]);
      setAggregatedVote(null);
      setDecryptedResults(null);
      setIsGenerating(false);
    }, 100);
  };

  const handleVote = () => {
    if (!publicKey || !voterName || !selectedCandidate) return;
    
    const encryptedData: Record<Candidate, string> = {
      Alice: '0',
      Bob: '0',
      Charlie: '0'
    };

    CANDIDATES.forEach(c => {
      const voteValue = c === selectedCandidate ? 1n : 0n;
      encryptedData[c] = publicKey.encrypt(voteValue).toString();
    });

    const newVote: EncryptedVote = {
      id: Math.random().toString(36).substring(7),
      voterName,
      encryptedData
    };

    setVotes([...votes, newVote]);
    setVoterName('');
    setSelectedCandidate('');
    setAggregatedVote(null);
    setDecryptedResults(null);
  };

  const handleAggregate = () => {
    if (!publicKey || votes.length === 0) return;

    // Start with E(0) for each candidate
    const aggregated: Record<Candidate, string> = {
      Alice: publicKey.encrypt(0n).toString(),
      Bob: publicKey.encrypt(0n).toString(),
      Charlie: publicKey.encrypt(0n).toString()
    };

    // Homomorphic addition: multiply ciphertexts modulo n^2
    votes.forEach(vote => {
      CANDIDATES.forEach(c => {
        const currentAgg = BigInt(aggregated[c]);
        const voteVal = BigInt(vote.encryptedData[c]);
        aggregated[c] = publicKey.add(currentAgg, voteVal).toString();
      });
    });

    setAggregatedVote(aggregated);
    setDecryptedResults(null);
  };

  const handleDecrypt = () => {
    if (!privateKey || !aggregatedVote) return;

    const results: Record<Candidate, number> = {
      Alice: 0,
      Bob: 0,
      Charlie: 0
    };

    CANDIDATES.forEach(c => {
      const decryptedBigInt = privateKey.decrypt(BigInt(aggregatedVote[c]));
      results[c] = Number(decryptedBigInt);
    });

    setDecryptedResults(results);
  };

  const truncate = (str: string, len = 12) => {
    if (str.length <= len) return str;
    return str.substring(0, len / 2) + '...' + str.substring(str.length - len / 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              Homomorphic Voting System
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
              A demonstration of privacy-preserving elections using the Paillier cryptosystem. 
              Votes are encrypted on the client, aggregated on the server without decryption, 
              and only the final tally is decrypted.
            </p>
          </div>
          <button
            onClick={handleGenerateKeys}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
            {publicKey ? 'Regenerate Keys' : 'Generate Keys'}
          </button>
        </header>

        {!publicKey ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <Key className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">System Not Initialized</h2>
            <p className="text-slate-500 mb-6">Generate a public/private key pair to start the election.</p>
            <button
              onClick={handleGenerateKeys}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
              Initialize System
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Voter Booth */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 px-5 py-4 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-slate-600" />
                  <h2 className="font-semibold text-slate-800">1. Voting Booth (Client)</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Voter Name</label>
                    <input
                      type="text"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                      placeholder="e.g. Alice Smith"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Candidate</label>
                    <div className="space-y-2">
                      {CANDIDATES.map(c => (
                        <label key={c} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedCandidate === c ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <input
                            type="radio"
                            name="candidate"
                            value={c}
                            checked={selectedCandidate === c}
                            onChange={() => setSelectedCandidate(c)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="ml-3 font-medium text-slate-700">{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleVote}
                    disabled={!voterName || !selectedCandidate}
                    className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    Encrypt & Submit Vote
                  </button>
                  
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Your vote is encrypted using the public key before leaving your device. A vote for Alice becomes [E(1), E(0), E(0)].</p>
                  </div>
                </div>
              </div>
              
              {/* Public Key Display */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-500" /> Public Key (n)
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded p-3 font-mono text-xs text-slate-600 break-all h-24 overflow-y-auto">
                  {publicKey.n.toString()}
                </div>
              </div>
            </div>

            {/* Column 2: Server Aggregation */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                <div className="bg-slate-100 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-slate-600" />
                    <h2 className="font-semibold text-slate-800">2. Server (Untrusted)</h2>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {votes.length} Votes
                  </span>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-5 max-h-[400px]">
                    {votes.length === 0 ? (
                      <div className="text-center text-slate-400 py-10">
                        No votes received yet.
                      </div>
                    ) : (
                      votes.map((vote, i) => (
                        <div key={vote.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm text-slate-700">{vote.voterName}</span>
                            <span className="text-xs text-slate-400">#{i + 1}</span>
                          </div>
                          <div className="space-y-1">
                            {CANDIDATES.map(c => (
                              <div key={c} className="flex justify-between text-xs font-mono">
                                <span className="text-slate-500">{c}:</span>
                                <span className="text-slate-700" title={vote.encryptedData[c]}>
                                  {truncate(vote.encryptedData[c], 16)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={handleAggregate}
                    disabled={votes.length === 0}
                    className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calculator className="w-4 h-4" />
                    Homomorphic Tally (E(v1) * E(v2))
                  </button>
                  
                  <div className="mt-4 bg-slate-100 p-3 rounded-lg text-xs text-slate-600">
                    The server multiplies the encrypted votes together. Due to Paillier's homomorphic properties, multiplying ciphertexts results in the encryption of the sum of the plaintexts.
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Tally Authority */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 px-5 py-4 flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-slate-600" />
                  <h2 className="font-semibold text-slate-800">3. Election Authority</h2>
                </div>
                
                <div className="p-5 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Aggregated Encrypted Result</h3>
                    {aggregatedVote ? (
                      <div className="space-y-2">
                        {CANDIDATES.map(c => (
                          <div key={c} className="bg-slate-50 border border-slate-200 rounded p-2 text-xs font-mono">
                            <div className="text-slate-500 mb-1">{c} Total (Encrypted):</div>
                            <div className="text-slate-800 break-all" title={aggregatedVote[c]}>
                              {truncate(aggregatedVote[c], 40)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-6 text-center text-slate-400 text-sm">
                        Waiting for server to aggregate votes...
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDecrypt}
                    disabled={!aggregatedVote}
                    className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Unlock className="w-4 h-4" />
                    Decrypt Final Results
                  </button>

                  {decryptedResults && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                      <h3 className="text-emerald-800 font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Official Election Results
                      </h3>
                      <div className="space-y-3">
                        {CANDIDATES.map(c => {
                          const totalVotes = Object.values(decryptedResults).reduce((a, b) => Number(a) + Number(b), 0);
                          const percentage = totalVotes === 0 ? 0 : Math.round((Number(decryptedResults[c]) / Number(totalVotes)) * 100);
                          
                          return (
                            <div key={c}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-emerald-900">{c}</span>
                                <span className="font-bold text-emerald-700">{decryptedResults[c]} votes ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-emerald-200 rounded-full h-2">
                                <div 
                                  className="bg-emerald-600 h-2 rounded-full transition-all duration-1000" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Private Key Display */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-500" /> Private Key (λ)
                </h3>
                <div className="bg-red-50 border border-red-100 rounded p-3 font-mono text-xs text-red-800 break-all h-24 overflow-y-auto">
                  {privateKey?.lambda.toString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-semibold">Kept secret by authority</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

