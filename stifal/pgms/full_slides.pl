#!/usr/bin/perl

open SEQ,"$ARGV[0]" || die "Type 'perl valid_scores_all_slides.pl x.seq x.con'\n";
@query_seq_file=<SEQ>;
close SEQ;
#print "@query_seq_file\n";
undef %seq;
foreach (@query_seq_file)
{
        if($_ =~ /^>(\w+)| /)
        {
		$key = $_;
		$tmp=();
        }
        else
        {
                chomp($_);
                $tmp=$tmp.$_;
		$seq{$key} = $tmp;
        }
}

open FILE,"$ARGV[1]" || die "could not open the file\n";
@consfile =<FILE>;
close FILE;

undef %cons;
foreach(@consfile)
{
        chomp($_);
        if($_ =~ /^FACTOR=(\w+)/)
        {
		push(@comm,$_);
		$keycon = $1;
		$tmpseq = ();
        }
        else
        {
		chomp ($_);
                $tmpseq = $tmpseq . $_;
                $tmpseq=$tmpseq.'-';
		$cons{$keycon} = $tmpseq;
        }
}

sub scores
{
	my ($ss) =@_;
	@spseq=split(//,$ss);

	for(my $k=0;$k<$row;$k++)
	{
		for(my $j=0;$j<$lencol;$j++)
		{
			for(my $i=0;$i<$row;$i++)
			{
				if($i!=$k)
				{
					if( $mat[$i][$j] eq 'A')
					{
						$a++;
						$jfreqa=($a/($row-1))+1;	#pseducount
						sub qu_check
						{
						        my($a,$b,$c) = @_;
						        if ($a eq $b)
							{
						                $q_freq=$c;
						                return $q_freq;
						        }
							else
							{
						                $q_freq=1;
						                return $q_freq;
						        }
						}
						$jff=qu_check($spseq[$j],$mat[$i][$j],$jfreqa);
					}
					elsif($mat[$i][$j] eq 'C')
					{
						$c++;
						$jfreqc=($c/($row-1))+1;
						$jff =qu_check($spseq[$j],$mat[$i][$j],$jfreqc);
					}
					elsif($mat[$i][$j] eq 'G')
					{
						$g++;
			                	$jfreqg=($g/($row-1))+1;
						$jff=qu_check($spseq[$j],$mat[$i][$j],$jfreqg);
					}
					elsif($mat[$i][$j] eq 'T')
					{
						$t++;
			                	$jfreqt=($t/($row-1))+1;
						$jff=qu_check($spseq[$j],$mat[$i][$j],$jfreqt);
		                        }
					push(@jqq_freq,$jff);
				}
				else
				{
					next;
				}
			}
               		@jobs_freq= sort {$b <=> $a} @jqq_freq;
	                push(@jobs_prob_no,$jobs_freq[0]);
        	        if($spseq[$j] eq 'A' || $spseq[$j] eq 'T')
                	{
                        	$jq_at++;
	                }
        	        elsif($spseq[$j] eq 'G' || $spseq[$j] eq 'C')
                	{
                        	$jq_gc++;
	                }

			$a=$c=$g=$t=0;
			$jfreqa=$freqc=$freqg=$jfreqt=();
			@jqq_freq=();
		}
		$incr=1;
	        foreach(@jobs_prob_no)
	        {
        		$incr*=$_;
	        }
        	$jq_apriori = $jq_at*(log (0.375)) + $jq_gc *(log (0.125));
	        $jq_score=log($incr) - $jq_apriori;
		$normal = $jq_score/$lencol;
#		print "LLLLLLLLLLLLLLLL :: $threshold\n";
#		print "ALL SCORES... $ss :: $jq_score\n";
                #if($ss eq $filecc[$k])
                {       
                        push (@valid_score,$normal);
                }       

		$incr=1;
     		$jq_apriori=$jq_score=$jq_at=$jq_gc=0;
		@jobs_prob_no=();
	}
}
foreach(@comm)
{
	@spcom=split(/\t+/,$_);
        foreach($spcom[2])
        {
                @spthre=split(/=/,$_);
                push(@threshold,$spthre[1]);
        }
}

for $keycon (sort keys %cons)
{
	$files = "$keycon"."_full".$c;             #name of the files + its increment
	$out="LL".$c;                  #Defining output in string variable
	$file_loc1 = $ARGV[2]."/".$files;
	open "$out", ">$file_loc1" || print "Cant open the file_loc: $file_loc1\n";
        # open"$out",">$ARGV[2]\/$files";
        $c++;

        print $out "\n****$keycon\n";
	@filecc=split(/-|\*/,$cons{$keycon});
	foreach(@filecc)
        {
                $wini=length($_);
        }
	print $out "LEN :: $wini\n";
	for $key (sort keys %seq)
	{	
		print $out "$key\n";
	#	print "SEQQ :: $seq{$key}\n";
		chomp($seq{$key});
		@splqu_seq=split(//,$seq{$key});
                $len=length($seq{$key});
		for(my $t=0;$t<=$len-$wini;$t++)
                        {
                                for (my $q=$t;$q<$t+$wini;$q++)
                                {
                                        $string.=$splqu_seq[$q];
                                }
                                push(@winslid_seq,$string);
 
                                $string_rev=reverse $string;
                                push(@winslid_seq_rev,$string_rev);
=d
                                $string =~tr/aAcCgGtT/tTgGcCaA/;
                                push(@winslid_seq_com,$string);
 
                                $string_comrev=reverse $string;
                                push(@winslid_seq_comrev,$string_comrev);
=cut
                                $string=();
                        }
=df
                        print "****@winslid_seq\n";
                        print "******@winslid_seq_rev\n";
                        print "*******@winslid_seq_com\n";
                        print "********@winslid_seq_comrev\n";
=cut		
		for($v=0;$v<=$#winslid_seq;$v++)
		{
			for($d=0;$d<=$#filecc;$d++)
        		{
                	      if(length($filecc[$d]) eq $wini && length($winslid_seq[$d]) eq $wini)
                        	{
                        		chomp ($filecc[$d]);
        #                       	print "WWWWWWWWWWW :: $filecc[$d]\n";
	                                @temp=split(//,$filecc[$d]);
        	                        $lencol=length($filecc[$d]);
                	                for(my $j=0;$j<$lencol;$j++)
                        	        {
                                		$mat[$row][$j]=$temp[$j];
	                                }
        	                        $row++;
                	         }
	                } 
			#print "****iIIII :: $winslid_seq[$v]\n";
			scores($winslid_seq[$v]);
			@validmax = sort {$b <=> $a} @valid_score;
                        if($valid_score[0] != 0)
                        {
                                print $out "FORWARD   + \t$winslid_seq[$v]\t\t\t";
                                printf $out "%.4f",$validmax[0];
                                print $out "\n";
                        }
                        @valid_score=@pred_score=();
			
			scores($winslid_seq_rev[$v]);
                        @validmax_rev = sort {$b <=> $a} @valid_score;
                        if($valid_score[0] != 0)
                        {
                                print $out "REVERSE   + \t$winslid_seq_rev[$v]\t\t\t";
                                printf $out "%.4f",$validmax_rev[0];
                                print $out "\n";
                        }
                        @valid_score=@pred_score=();
=d
			scores($winslid_seq_com[$v]);
                        @validmax_com = sort {$b <=> $a} @valid_score;
                        if($valid_score[0] != 0)
                        {
                                print $out "FORWARD   - \t$winslid_seq_com[$v]\t\t\t";
                                printf $out "%.4f",$validmax_com[0];
                                print $out "\t\t\t 'VALIDATED'\n";
                        }
                        @valid_score=@pred_score=();
			
			scores($winslid_seq_comrev[$v]);
                        @validmax_comrev = sort {$b <=> $a} @valid_score;
                        if($valid_score[0] != 0)
                        {
                                print $out "REVERSE   - \t$winslid_seq_comrev[$v]\t\t\t";
                                printf $out "%.4f",$validmax_comrev[0];
                                print $out "\t\t\t 'VALIDATED'\n";
                        }
                        @valid_score=();
=cut			
			$row=0;
		}	
		@winslid_seq=@winslid_seq_rev=@winslid_seq_com=@winslid_seq_comrev=();
		print $out "************************ END OF FILE*********8 \n";
	}
}	

